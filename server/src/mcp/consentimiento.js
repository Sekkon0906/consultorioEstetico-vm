/**
 * La pantalla donde la doctora aprueba —o rechaza— un conector.
 *
 * ES EL ÚNICO SITIO DONDE SE DECIDE QUIÉN PUEDE
 * Todo lo demás del OAuth es maquinaria: emitir, canjear, renovar. La pregunta
 * de fondo —"¿tiene esta persona derecho a dar acceso a las herramientas del
 * consultorio?"— se contesta aquí y en ningún otro lado.
 *
 * Por eso exige sesión Y rol de administrador, con `verifyToken` y
 * `requireRole`, que son los mismos que protegen el panel. Un conector
 * autorizado puede cambiar precios y promociones: dar ese poder tiene que
 * costar exactamente lo mismo que entrar al panel.
 *
 * POR QUÉ EL FORMULARIO NO EMITE EL CÓDIGO DIRECTAMENTE
 * La pantalla es del sitio (Next) y esto es la API (Express): dos orígenes.
 * El navegador llega al `/authorize` de la API sin cabecera de sesión —una
 * redirección no la lleva—, así que si el código se emitiera allí se le estaría
 * dando a cualquiera que abra la dirección.
 *
 * El camino es: la API redirige a la pantalla → la pantalla comprueba la sesión
 * de verdad → la doctora aprueba → la pantalla llama AQUÍ con su token → y solo
 * entonces se emite el código.
 */

const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");
const { provider, emitirCodigo } = require("./proveedorOauth");

/**
 * GET /mcp/consentimiento?client_id=…
 * Datos para pintar la pantalla: quién pide acceso.
 *
 * Devuelve el nombre que el cliente declaró AL REGISTRARSE, no uno que venga
 * en la petición. Un nombre tomado de la URL lo puede poner cualquiera, y la
 * pantalla estaría diciendo "Claude quiere conectarse" para algo que no lo es.
 */
router.get("/", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const cliente = await provider.clientsStore.getClient(String(req.query.client_id || ""));
    if (!cliente) return res.status(404).json({ ok: false, error: "Cliente no registrado" });
    return res.json({
      ok: true,
      data: {
        clientId: cliente.client_id,
        nombre: cliente.client_name || cliente.client_id,
        uri: cliente.client_uri || null,
        redirectUris: cliente.redirect_uris,
      },
    });
  } catch (err) {
    console.error("Error GET /mcp/consentimiento:", err);
    return res.status(500).json({ ok: false, error: "Error al leer el cliente" });
  }
});

/**
 * POST /mcp/consentimiento — la doctora aprueba.
 * Devuelve la dirección a la que el navegador debe volver, ya con el código.
 */
router.post("/", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { clientId, redirectUri, codeChallenge, state, scope, resource } = req.body || {};

  if (!clientId || !redirectUri || !codeChallenge) {
    return res.status(400).json({ ok: false, error: "Faltan parámetros de la autorización" });
  }

  try {
    const cliente = await provider.clientsStore.getClient(clientId);
    if (!cliente) return res.status(404).json({ ok: false, error: "Cliente no registrado" });

    /* La dirección de retorno tiene que ser una de las que el cliente declaró
       al registrarse. Sin esta comprobación, cualquiera podría montar una
       autorización que devuelve el código a un servidor suyo: la doctora vería
       una pantalla legítima, aprobaría de buena fe, y el código se iría a otro
       sitio. Es el fallo clásico de OAuth y es este `includes`. */
    if (!cliente.redirect_uris.includes(redirectUri)) {
      return res.status(400).json({ ok: false, error: "Dirección de retorno no autorizada" });
    }

    const codigo = await emitirCodigo({
      clientId,
      userId: req.user.id,
      redirectUri,
      codeChallenge,
      scopes: scope ? String(scope).split(/\s+/).filter(Boolean) : [],
      resource: resource || null,
    });

    const destino = new URL(redirectUri);
    destino.searchParams.set("code", codigo);
    if (state) destino.searchParams.set("state", state);

    return res.json({ ok: true, redirigirA: destino.toString() });
  } catch (err) {
    console.error("Error POST /mcp/consentimiento:", err);
    return res.status(500).json({ ok: false, error: "No se pudo autorizar" });
  }
});

/**
 * GET /mcp/consentimiento/conexiones — qué conectores están vivos.
 * DELETE /mcp/consentimiento/conexiones/:clientId — cortar uno.
 *
 * Poder revocar es parte de poder autorizar. Sin esta lista, la doctora no
 * tendría forma de saber qué tiene conectado ni de cortarlo, y el único
 * remedio ante una sospecha sería llamar a alguien.
 */
router.get("/conexiones", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { pool } = require("../lib/db");
    const { rows } = await pool.query(
      `SELECT c.client_id,
              c.nombre,
              min(t.creado_en)                          AS desde,
              count(*) FILTER (WHERE t.revocado_en IS NULL) AS vivos
         FROM oauth_tokens t
         JOIN oauth_clientes c ON c.client_id = t.client_id
        WHERE t.user_id = $1
        GROUP BY c.client_id, c.nombre
       HAVING count(*) FILTER (WHERE t.revocado_en IS NULL) > 0
        ORDER BY min(t.creado_en) DESC`,
      [req.user.id]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error GET /mcp/consentimiento/conexiones:", err);
    return res.status(500).json({ ok: false, error: "Error al leer las conexiones" });
  }
});

router.delete("/conexiones/:clientId", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { pool } = require("../lib/db");
    /* Se revocan los del usuario que pide, no todos los del cliente: si algún
       día hay dos administradoras, cortar la conexión de una no puede cortar
       la de la otra. */
    const { rowCount } = await pool.query(
      `UPDATE oauth_tokens SET revocado_en = now()
        WHERE client_id = $1 AND user_id = $2 AND revocado_en IS NULL`,
      [req.params.clientId, req.user.id]
    );
    return res.json({ ok: true, revocados: rowCount });
  } catch (err) {
    console.error("Error DELETE /mcp/consentimiento/conexiones:", err);
    return res.status(500).json({ ok: false, error: "No se pudo revocar" });
  }
});

module.exports = router;
