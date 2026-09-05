const express     = require("express");
const router      = express.Router();
const crypto      = require("crypto");
const Anthropic   = require("@anthropic-ai/sdk");
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");
const { DEFINICIONES, ejecutar, escribe } = require("../ia/herramientas");

/**
 * El modelo del copiloto.
 *
 * POR QUE SONNET Y NO OPUS
 * Lo que hace este asistente es llamar a ocho herramientas sobre un esquema
 * pequeno y conocido: crear un procedimiento, poner una promocion, cambiar
 * el WhatsApp, contar las citas de un dia. Es uso de herramientas con
 * argumentos claros, no razonamiento abierto.
 *
 * Sonnet resuelve eso igual de bien y cuesta una fraccion. En un consultorio
 * de una sola doctora, que usara esto unas cuantas veces al mes, la
 * diferencia de precio es real y la de calidad no se nota.
 *
 * Se deja `ANTHROPIC_MODEL` como valvula: si algun dia el copiloto empieza
 * a equivocarse en peticiones ambiguas, se sube a Opus cambiando UNA
 * variable de entorno, sin tocar codigo ni desplegar.
 */
const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// ── Clave del copiloto ────────────────────────────────────────────────────
// Dos fuentes, en orden: 1) la que la doctora guarda desde el panel
// (cifrada en la base con pgcrypto), 2) ANTHROPIC_API_KEY del servidor.
// Así el copiloto sigue funcionando con la variable de entorno de siempre
// si nadie configuró una clave propia todavía.
let clienteCache = { key: null, instancia: null };

async function obtenerApiKey() {
  if (process.env.SECRETS_ENCRYPTION_KEY) {
    try {
      const { rows } = await pool.query(
        `select pgp_sym_decrypt(api_key_cifrada, $1) as clave
           from integraciones_ia where proveedor = 'anthropic'`,
        [process.env.SECRETS_ENCRYPTION_KEY]
      );
      if (rows[0]?.clave) return rows[0].clave;
    } catch (err) {
      console.error("No se pudo leer la clave guardada del copiloto:", err);
    }
  }
  return process.env.ANTHROPIC_API_KEY || null;
}

// El cliente se recrea solo si la clave efectiva cambió, así el servidor
// arranca igual aunque el copiloto no esté configurado todavía.
async function getCliente() {
  const key = await obtenerApiKey();
  if (!key) return null;
  if (clienteCache.key === key) return clienteCache.instancia;
  const instancia = new Anthropic({ apiKey: key });
  clienteCache = { key, instancia };
  return instancia;
}

const INSTRUCCIONES = `Eres el asistente administrativo del consultorio de medicina estética
de la Dra. Julieth Vanessa Medina Orjuela, en Ibagué (Tolima, Colombia).

Ayudas a la doctora a mantener el contenido del sitio: procedimientos, promociones
e información general del consultorio. Respondes en español, de forma breve y directa.

Cómo trabajas:

- Antes de modificar algo, léelo primero. Usa listar_procedimientos o leer_configuracion
  para obtener el id o la clave exacta en vez de suponerlos.
- Si falta un dato para completar una acción, pregúntalo. No lo inventes ni uses un valor
  "razonable" por defecto: esto es un consultorio médico y un precio o una duración
  equivocada tiene consecuencias reales.
- Cuando propones una modificación, la doctora la revisa y la confirma antes de que se
  aplique. Explica en una frase qué vas a hacer; ella verá los campos exactos.
- Con citas_del_dia puedes decir qué citas hay en una fecha (nombre, hora, procedimiento,
  estado). Con resumen_de_citas puedes dar conteos agregados en un rango. No tienes acceso
  a teléfono, correo ni ningún otro dato de contacto del paciente: no lo pidas ni lo inventes.
- No conoces la fecha de hoy por tu cuenta: siempre viene indicada al inicio del mensaje del
  usuario. Cuando te pregunten por "hoy", "mañana" o un día de la semana, calcula la fecha
  AAAA-MM-DD a partir de esa fecha de referencia antes de llamar a una herramienta.
- Los precios son en pesos colombianos. Las fechas van en formato AAAA-MM-DD.`;

// ── Utilidades ───────────────────────────────────────────────────────────────

function textoDe(content) {
  return content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

async function auditar(campos) {
  try {
    await pool.query(
      `INSERT INTO auditoria_ia
         (user_id, conversacion_id, mensaje, herramienta, argumentos, resultado, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        campos.userId, campos.conversacionId, campos.mensaje,
        campos.herramienta || null,
        campos.argumentos ? JSON.stringify(campos.argumentos) : null,
        campos.resultado, campos.detalle || null,
      ]
    );
  } catch (err) {
    // La auditoría no debe tumbar la petición, pero sí dejar rastro en el log.
    console.error("No se pudo auditar la acción del copiloto:", err);
  }
}

// Estructura de mensajes que entiende la API, saneada de lo que manda el cliente.
function normalizarHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-40); // el historial no crece sin límite
}

// ── POST /copiloto/mensaje ───────────────────────────────────────────────────
// Devuelve o bien una respuesta de texto, o bien una PROPUESTA pendiente de
// confirmación. Las herramientas de solo lectura se ejecutan aquí mismo; las de
// escritura nunca.
router.post("/mensaje", verifyToken, requireRole(["admin"]), async (req, res) => {
  const api = await getCliente();
  if (!api) {
    return res.status(503).json({
      ok: false,
      error: "El copiloto no está configurado. Falta ANTHROPIC_API_KEY en el servidor.",
    });
  }

  const { mensaje, historial } = req.body || {};
  if (typeof mensaje !== "string" || !mensaje.trim()) {
    return res.status(400).json({ ok: false, error: "Falta el mensaje" });
  }
  if (mensaje.length > 4000) {
    return res.status(400).json({ ok: false, error: "El mensaje es demasiado largo" });
  }

  const conversacionId = req.body.conversacionId || crypto.randomUUID();
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const mensajeConFecha = `[Fecha de hoy: ${hoy}]\n${mensaje}`;
  const mensajes = [...normalizarHistorial(historial), { role: "user", content: mensajeConFecha }];

  try {
    // Bucle de lecturas: el modelo puede consultar varias veces antes de
    // responder o de proponer un cambio. El tope evita un ciclo infinito.
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      const respuesta = await api.messages.create({
        model: MODELO,
        max_tokens: 4096,
        system: INSTRUCCIONES,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        tools: DEFINICIONES,
        messages: mensajes,
      });

      if (respuesta.stop_reason === "refusal") {
        await auditar({ userId: req.user.id, conversacionId, mensaje, resultado: "error", detalle: "refusal" });
        return res.json({
          ok: true, conversacionId,
          data: { tipo: "texto", texto: "No puedo ayudarte con eso. ¿Probamos con otra cosa?" },
        });
      }

      if (respuesta.stop_reason !== "tool_use") {
        await auditar({ userId: req.user.id, conversacionId, mensaje, resultado: "solo_lectura" });
        return res.json({
          ok: true, conversacionId,
          data: { tipo: "texto", texto: textoDe(respuesta.content) },
          historial: [...mensajes, { role: "assistant", content: respuesta.content }],
        });
      }

      const llamadas = respuesta.content.filter((b) => b.type === "tool_use");
      const deEscritura = llamadas.find((l) => escribe(l.name));

      // Si el modelo quiere escribir, se detiene aquí y se le devuelve la
      // propuesta a la doctora. Nada se ha modificado todavía.
      if (deEscritura) {
        await auditar({
          userId: req.user.id, conversacionId, mensaje,
          herramienta: deEscritura.name, argumentos: deEscritura.input, resultado: "propuesta",
        });
        return res.json({
          ok: true, conversacionId,
          data: {
            tipo: "propuesta",
            explicacion: textoDe(respuesta.content),
            herramienta: deEscritura.name,
            argumentos: deEscritura.input,
          },
          historial: [...mensajes, { role: "assistant", content: respuesta.content }],
        });
      }

      // Solo lecturas: se ejecutan y se devuelven al modelo para que continúe.
      const resultados = await Promise.all(
        llamadas.map(async (l) => ({
          type: "tool_result",
          tool_use_id: l.id,
          content: JSON.stringify(await ejecutar(l.name, l.input)),
        }))
      );

      mensajes.push({ role: "assistant", content: respuesta.content });
      mensajes.push({ role: "user", content: resultados });
    }

    return res.json({
      ok: true, conversacionId,
      data: { tipo: "texto", texto: "La consulta se volvió demasiado larga. ¿Puedes plantearla de otra forma?" },
    });
  } catch (err) {
    console.error("Error POST /copiloto/mensaje:", err);
    const status = err instanceof Anthropic.RateLimitError ? 429
                 : err instanceof Anthropic.AuthenticationError ? 502
                 : 500;
    const detalle = err instanceof Anthropic.RateLimitError
      ? "El copiloto está recibiendo demasiadas peticiones. Espera un momento."
      : err instanceof Anthropic.AuthenticationError
      ? "La clave del copiloto no es válida. Revisa ANTHROPIC_API_KEY."
      : "El copiloto no pudo responder. Intenta de nuevo.";
    await auditar({ userId: req.user.id, conversacionId, mensaje, resultado: "error", detalle: String(err && err.message) });
    return res.status(status).json({ ok: false, error: detalle });
  }
});

// ── POST /copiloto/confirmar ─────────────────────────────────────────────────
// Ejecuta una propuesta que la doctora aprobó. El servidor NO confía en que la
// herramienta sea legítima solo porque venga del cliente: se vuelve a validar
// contra el catálogo y se ejecuta con las mismas comprobaciones de siempre.
router.post("/confirmar", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { herramienta, argumentos, conversacionId, mensaje } = req.body || {};

  if (typeof herramienta !== "string" || !DEFINICIONES.some((d) => d.name === herramienta)) {
    return res.status(400).json({ ok: false, error: "Herramienta no reconocida" });
  }
  if (!escribe(herramienta)) {
    return res.status(400).json({ ok: false, error: "Esa operación no requiere confirmación" });
  }
  if (!argumentos || typeof argumentos !== "object" || Array.isArray(argumentos)) {
    return res.status(400).json({ ok: false, error: "Argumentos inválidos" });
  }

  const conv = conversacionId || crypto.randomUUID();

  try {
    const resultado = await ejecutar(herramienta, argumentos);

    if (resultado && resultado.error) {
      await auditar({
        userId: req.user.id, conversacionId: conv, mensaje: mensaje || "(confirmación)",
        herramienta, argumentos, resultado: "error", detalle: resultado.error,
      });
      return res.status(400).json({ ok: false, error: resultado.error });
    }

    await auditar({
      userId: req.user.id, conversacionId: conv, mensaje: mensaje || "(confirmación)",
      herramienta, argumentos, resultado: "confirmada",
    });
    return res.json({ ok: true, data: resultado });
  } catch (err) {
    console.error("Error POST /copiloto/confirmar:", err);
    await auditar({
      userId: req.user.id, conversacionId: conv, mensaje: mensaje || "(confirmación)",
      herramienta, argumentos, resultado: "error", detalle: String(err && err.message),
    });
    return res.status(500).json({ ok: false, error: "No se pudo aplicar el cambio" });
  }
});

// ── POST /copiloto/rechazar ──────────────────────────────────────────────────
// La doctora descartó la propuesta. Solo deja constancia.
router.post("/rechazar", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { herramienta, argumentos, conversacionId, mensaje } = req.body || {};
  await auditar({
    userId: req.user.id,
    conversacionId: conversacionId || crypto.randomUUID(),
    mensaje: mensaje || "(rechazo)",
    herramienta: typeof herramienta === "string" ? herramienta : null,
    argumentos: argumentos && typeof argumentos === "object" ? argumentos : null,
    resultado: "rechazada",
  });
  return res.json({ ok: true });
});

// ── GET /copiloto/auditoria ──────────────────────────────────────────────────
router.get("/auditoria", verifyToken, requireRole(["admin"]), async (req, res) => {
  try {
    const limite = Math.min(parseInt(req.query.limite, 10) || 50, 200);
    const { rows } = await pool.query(
      `SELECT a.id, a.mensaje, a.herramienta, a.argumentos, a.resultado, a.detalle,
              a.creado_en, u.nombres, u.apellidos
         FROM auditoria_ia a
         LEFT JOIN usuarios u ON u.id = a.user_id
        ORDER BY a.creado_en DESC LIMIT $1`,
      [limite]
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error GET /copiloto/auditoria:", err);
    return res.status(500).json({ ok: false, error: "Error al leer la auditoría" });
  }
});

// ── GET /copiloto/config ─────────────────────────────────────────────────────
// Nunca devuelve la clave, solo si hay una configurada y de dónde sale --
// para que el panel muestre "Configurada ✓" sin exponer el valor.
router.get("/config", verifyToken, requireRole(["admin"]), async (_req, res) => {
  try {
    if (!process.env.SECRETS_ENCRYPTION_KEY) {
      return res.json({
        ok: true,
        data: {
          configurada: !!process.env.ANTHROPIC_API_KEY,
          origen: process.env.ANTHROPIC_API_KEY ? "servidor" : null,
          puedeGuardarPropia: false,
        },
      });
    }
    const { rows } = await pool.query(
      `select configurada_en from integraciones_ia where proveedor = 'anthropic'`
    );
    const propia = rows[0];
    return res.json({
      ok: true,
      data: {
        configurada: !!propia || !!process.env.ANTHROPIC_API_KEY,
        origen: propia ? "propia" : process.env.ANTHROPIC_API_KEY ? "servidor" : null,
        configuradaEn: propia?.configurada_en || null,
        puedeGuardarPropia: true,
      },
    });
  } catch (err) {
    console.error("Error GET /copiloto/config:", err);
    return res.status(500).json({ ok: false, error: "Error al leer la configuración" });
  }
});

// ── PUT /copiloto/config ─────────────────────────────────────────────────────
// Guarda (o reemplaza) la clave propia de la doctora, cifrada. Requiere que
// el servidor tenga SECRETS_ENCRYPTION_KEY -- sin eso no hay con qué cifrar,
// y devolvemos un error claro en vez de guardarla en texto plano.
router.put("/config", verifyToken, requireRole(["admin"]), async (req, res) => {
  const { apiKey } = req.body || {};
  if (typeof apiKey !== "string" || apiKey.trim().length < 10) {
    return res.status(400).json({ ok: false, error: "Clave inválida" });
  }
  if (!process.env.SECRETS_ENCRYPTION_KEY) {
    return res.status(503).json({
      ok: false,
      error: "El servidor no tiene SECRETS_ENCRYPTION_KEY configurada -- no hay con qué cifrar la clave. Pídele a quien administra el hosting que la agregue.",
    });
  }
  try {
    await pool.query(
      `insert into integraciones_ia (proveedor, api_key_cifrada, configurada_en, configurada_por)
       values ('anthropic', pgp_sym_encrypt($1, $2), now(), $3)
       on conflict (proveedor) do update
         set api_key_cifrada = excluded.api_key_cifrada,
             configurada_en = now(),
             configurada_por = excluded.configurada_por`,
      [apiKey.trim(), process.env.SECRETS_ENCRYPTION_KEY, req.user.id]
    );
    clienteCache = { key: null, instancia: null }; // fuerza a recrear el cliente con la clave nueva
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /copiloto/config:", err);
    return res.status(500).json({ ok: false, error: "No se pudo guardar la clave" });
  }
});

// ── DELETE /copiloto/config ──────────────────────────────────────────────────
// Quita la clave propia. El copiloto vuelve a depender de ANTHROPIC_API_KEY
// del servidor (o queda inactivo si tampoco existe esa).
router.delete("/config", verifyToken, requireRole(["admin"]), async (_req, res) => {
  try {
    await pool.query(`delete from integraciones_ia where proveedor = 'anthropic'`);
    clienteCache = { key: null, instancia: null };
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /copiloto/config:", err);
    return res.status(500).json({ ok: false, error: "No se pudo quitar la clave" });
  }
});

module.exports = router;
