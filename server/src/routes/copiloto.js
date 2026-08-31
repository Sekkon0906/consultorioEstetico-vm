const express     = require("express");
const router      = express.Router();
const crypto      = require("crypto");
const Anthropic   = require("@anthropic-ai/sdk");
const { pool }    = require("../lib/db");
const verifyToken = require("../middlewares/verifyToken");
const requireRole = require("../middlewares/requireRole");
const { DEFINICIONES, ejecutar, escribe } = require("../ia/herramientas");

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5";

// El cliente se crea una sola vez, pero solo si hay clave: así el servidor
// arranca igual aunque el copiloto no esté configurado todavía.
let cliente = null;
function getCliente() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cliente) cliente = new Anthropic();
  return cliente;
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
- No tienes acceso a datos de pacientes y no debes pedirlos. Sobre citas solo puedes dar
  conteos agregados con resumen_de_citas. Si te piden saber quién tiene una cita, explica
  que esa información solo está en la sección de Citas del panel.
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
  const api = getCliente();
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
  const mensajes = [...normalizarHistorial(historial), { role: "user", content: mensaje }];

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

module.exports = router;
