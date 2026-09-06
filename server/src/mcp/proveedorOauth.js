/**
 * Proveedor OAuth 2.1 del conector MCP.
 *
 * QUÉ RESUELVE
 * El servidor MCP se protegía con un token compartido en `MCP_TOKEN`. Sirve
 * para conectar Claude Desktop a mano, pero tiene dos problemas de fondo: no
 * distingue quién llama, y no caduca solo. Y claude.ai no acepta conectores
 * así — exige OAuth.
 *
 * QUIÉN PUEDE AUTORIZAR: SOLO UN ADMINISTRADOR
 * Es la regla que sostiene todo lo demás. Estas herramientas cambian precios y
 * promociones del consultorio; que un paciente pudiera autorizar un conector
 * sería regalarle el panel. La comprobación NO está aquí sino en la ruta de
 * consentimiento, que es la única que ve una sesión de verdad; aquí solo se
 * emiten códigos para un `user_id` que ya llegó verificado.
 *
 * LOS SECRETOS SE GUARDAN EN RESUMEN
 * Ni los códigos ni los tokens se escriben en claro. Un volcado de las tablas
 * no puede convertirse en acceso.
 *
 * SHA-256 y no argon2, a propósito: argon2 es lento por diseño para resistir
 * fuerza bruta sobre contraseñas humanas, y esto son valores aleatorios de 256
 * bits que no se adivinan. Medio segundo de argon2 en CADA llamada del
 * conector sería pagar un coste sin comprar nada.
 */

const crypto = require("crypto");
const { pool } = require("../lib/db");
const {
  InvalidGrantError,
  InvalidTokenError,
  ServerError,
} = require("@modelcontextprotocol/sdk/server/auth/errors.js");

/* Un código vive un minuto. Es el eslabón más corto porque viaja por la barra
   de direcciones del navegador y acaba en el historial y en los registros de
   cualquier intermediario; cuanto menos tiempo sirva, mejor. */
const VIDA_CODIGO_MS = 60 * 1000;
/* Una hora de acceso. Corta para que un token filtrado deje de servir pronto,
   y con refresco para que la doctora no note nada. */
const VIDA_ACCESO_S = 60 * 60;

const resumen = (v) => crypto.createHash("sha256").update(v).digest("hex");
const aleatorio = () => crypto.randomBytes(32).toString("base64url");

/* ── Almacén de clientes ───────────────────────────────────────────────────
   claude.ai se registra solo la primera vez (RFC 7591). No hay lista blanca
   que mantener a mano: lo que controla el acceso no es conocer al cliente de
   antemano, es que un administrador autorice. */
const clientsStore = {
  async getClient(clientId) {
    const { rows } = await pool.query(
      "SELECT client_id, client_secret, redirect_uris, metadatos FROM oauth_clientes WHERE client_id = $1",
      [clientId]
    );
    if (!rows.length) return undefined;
    const c = rows[0];
    return {
      client_id: c.client_id,
      client_secret: c.client_secret || undefined,
      redirect_uris: c.redirect_uris,
      ...c.metadatos,
    };
  },

  async registerClient(cliente) {
    await pool.query(
      `INSERT INTO oauth_clientes (client_id, client_secret, nombre, redirect_uris, metadatos)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (client_id) DO UPDATE
         SET redirect_uris = EXCLUDED.redirect_uris,
             metadatos     = EXCLUDED.metadatos`,
      [
        cliente.client_id,
        cliente.client_secret || null,
        cliente.client_name || "",
        cliente.redirect_uris,
        /* Se guarda el resto del registro tal cual. El cliente manda campos
           que el protocolo puede ampliar, y devolverlos cambiados o perderlos
           rompe validaciones del lado del cliente por motivos invisibles. */
        JSON.stringify(cliente),
      ]
    );
    return cliente;
  },
};

/**
 * Emite el código de autorización. La llama la ruta de consentimiento DESPUÉS
 * de comprobar que quien aprueba es un administrador con sesión.
 *
 * Devuelve el código en claro una sola vez: en la base solo queda su resumen.
 */
async function emitirCodigo({ clientId, userId, redirectUri, codeChallenge, scopes, resource }) {
  const codigo = aleatorio();
  await pool.query(
    `INSERT INTO oauth_codigos
       (codigo_hash, client_id, user_id, redirect_uri, code_challenge, scopes, resource, expira_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7, now() + interval '60 seconds')`,
    [resumen(codigo), clientId, userId, redirectUri, codeChallenge, scopes || [], resource || null]
  );
  return codigo;
}

async function emitirTokens({ clientId, userId, scopes, resource }) {
  const acceso = aleatorio();
  const refresco = aleatorio();
  await pool.query(
    `INSERT INTO oauth_tokens (token_hash, tipo, client_id, user_id, scopes, resource, expira_en)
     VALUES ($1,'acceso',$3,$4,$5,$6, now() + ($7 || ' seconds')::interval),
            ($2,'refresco',$3,$4,$5,$6, NULL)`,
    [resumen(acceso), resumen(refresco), clientId, userId, scopes || [], resource || null, String(VIDA_ACCESO_S)]
  );
  return {
    access_token: acceso,
    token_type: "Bearer",
    expires_in: VIDA_ACCESO_S,
    refresh_token: refresco,
    scope: (scopes || []).join(" "),
  };
}

const provider = {
  clientsStore,

  /**
   * Manda el navegador a la pantalla de consentimiento del sitio.
   *
   * NO emite el código aquí. En este punto no se sabe quién está al otro lado:
   * la petición llega del navegador sin sesión de la API. Emitirlo ahora sería
   * dárselo a cualquiera que conozca la dirección.
   *
   * Los parámetros viajan en la URL para que la pantalla pueda devolverlos
   * intactos; ninguno es secreto —el reto de PKCE es público por diseño, su
   * pareja es la que no viaja—.
   */
  async authorize(client, params, res) {
    const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    const q = new URLSearchParams({
      client_id: client.client_id,
      client_name: client.client_name || client.client_id,
      redirect_uri: params.redirectUri,
      code_challenge: params.codeChallenge,
    });
    if (params.state) q.set("state", params.state);
    if (params.scopes?.length) q.set("scope", params.scopes.join(" "));
    if (params.resource) q.set("resource", params.resource.toString());
    res.redirect(`${base}/conectar-claude?${q.toString()}`);
  },

  /** PKCE: el reto que se guardó al emitir el código. */
  async challengeForAuthorizationCode(client, authorizationCode) {
    const { rows } = await pool.query(
      `SELECT code_challenge FROM oauth_codigos
        WHERE codigo_hash = $1 AND client_id = $2
          AND usado_en IS NULL AND expira_en > now()`,
      [resumen(authorizationCode), client.client_id]
    );
    if (!rows.length) throw new InvalidGrantError("Código inválido o vencido.");
    return rows[0].code_challenge;
  },

  /**
   * Canjea el código por tokens.
   *
   * El código se marca usado en la MISMA consulta que lo lee, con la condición
   * `usado_en IS NULL` dentro del UPDATE. Leer y luego escribir dejaría una
   * ventana en la que dos peticiones simultáneas pasan las dos la
   * comprobación: quien intercepte el código podría canjearlo a la vez que el
   * cliente legítimo. Así el segundo no encuentra fila y falla.
   */
  async exchangeAuthorizationCode(client, authorizationCode, _codeVerifier, redirectUri) {
    const { rows } = await pool.query(
      `UPDATE oauth_codigos
          SET usado_en = now()
        WHERE codigo_hash = $1
          AND client_id   = $2
          AND usado_en IS NULL
          AND expira_en > now()
        RETURNING user_id, scopes, resource, redirect_uri`,
      [resumen(authorizationCode), client.client_id]
    );
    if (!rows.length) throw new InvalidGrantError("Código inválido, vencido o ya usado.");
    const c = rows[0];

    /* La dirección de retorno tiene que ser la misma con la que se pidió el
       código. Sin esto, un cliente podría pedir el código apuntando a un sitio
       y canjearlo desde otro. */
    if (redirectUri && redirectUri !== c.redirect_uri) {
      throw new InvalidGrantError("La dirección de retorno no coincide.");
    }

    return emitirTokens({
      clientId: client.client_id,
      userId: c.user_id,
      scopes: c.scopes,
      resource: c.resource,
    });
  },

  /**
   * Renueva el acceso.
   *
   * El refresco se ROTA: se revoca el viejo y se entrega uno nuevo. Si alguien
   * roba un refresco y lo usa, el legítimo deja de funcionar en su siguiente
   * intento — y ese fallo es la señal de que algo pasó. Con un refresco fijo,
   * el ladrón mantiene acceso indefinido y nadie se entera nunca.
   */
  async exchangeRefreshToken(client, refreshToken, scopes) {
    const { rows } = await pool.query(
      `UPDATE oauth_tokens
          SET revocado_en = now()
        WHERE token_hash = $1 AND tipo = 'refresco'
          AND client_id  = $2
          AND revocado_en IS NULL
        RETURNING user_id, scopes, resource`,
      [resumen(refreshToken), client.client_id]
    );
    if (!rows.length) throw new InvalidGrantError("Refresco inválido o revocado.");
    const t = rows[0];
    return emitirTokens({
      clientId: client.client_id,
      userId: t.user_id,
      scopes: scopes?.length ? scopes : t.scopes,
      resource: t.resource,
    });
  },

  /** Valida el token que llega en cada llamada del conector. */
  async verifyAccessToken(token) {
    const { rows } = await pool.query(
      `SELECT t.client_id, t.user_id, t.scopes, t.resource, t.expira_en
         FROM oauth_tokens t
        WHERE t.token_hash = $1 AND t.tipo = 'acceso'
          AND t.revocado_en IS NULL
          AND (t.expira_en IS NULL OR t.expira_en > now())`,
      [resumen(token)]
    );
    if (!rows.length) throw new InvalidTokenError("Token inválido o vencido.");
    const t = rows[0];

    /* Se vuelve a comprobar que sigue siendo administrador, en cada llamada y
       no solo al autorizar. Si a alguien se le quita el rol, sus conectores
       tienen que dejar de funcionar de inmediato; mirar solo en el momento de
       autorizar dejaría un acceso vivo hasta que caducara el token. */
    const { rows: admin } = await pool.query(
      "SELECT 1 FROM admin_users WHERE uid = $1",
      [t.user_id]
    );
    if (!admin.length) throw new InvalidTokenError("La cuenta ya no es administradora.");

    return {
      token,
      clientId: t.client_id,
      scopes: t.scopes || [],
      expiresAt: t.expira_en ? Math.floor(new Date(t.expira_en).getTime() / 1000) : undefined,
      resource: t.resource ? new URL(t.resource) : undefined,
      extra: { userId: t.user_id },
    };
  },

  /** Revocar mata acceso y refresco a la vez: son la misma concesión. */
  async revokeToken(client, request) {
    try {
      await pool.query(
        `UPDATE oauth_tokens SET revocado_en = now()
          WHERE token_hash = $1 AND client_id = $2 AND revocado_en IS NULL`,
        [resumen(request.token), client.client_id]
      );
    } catch (err) {
      throw new ServerError(`No se pudo revocar: ${err.message}`);
    }
  },
};

module.exports = { provider, emitirCodigo, VIDA_CODIGO_MS };
