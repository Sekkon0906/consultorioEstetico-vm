require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const cookieParser = require("cookie-parser");
const {
  cabecerasSeguras, limiteLogin, limiteCorreo, limiteIa, limiteGeneral,
} = require("./middlewares/proteccion");

const autenticacionRoutes = require("./routes/autenticacion");
const usuariosRoutes     = require("./routes/usuarios");
const procedimientosRoutes = require("./routes/procedimientos");
const testimoniosRoutes  = require("./routes/testimonios");
const citasRoutes        = require("./routes/citas");
const bloqueosHorasRoutes = require("./routes/bloqueosHoras");
const disponibilidadRoutes = require("./routes/disponibilidad");
const comentariosRoutes  = require("./routes/comentarios");
const uploadsRoutes      = require("./routes/uploads");
const charlasRoutes      = require("./routes/charlas");
const analyticsRoutes    = require("./routes/analytics");
const reportesRoutes     = require("./routes/reportes");
const reagendasRoutes    = require("./routes/reagendas");
const galeriaConfianzaRoutes = require("./routes/galeriaConfianza");
const configuracionRoutes = require("./routes/configuracion");
const copilotoRoutes     = require("./routes/copiloto");

const app = express();

// Detrás del proxy de Railway/Vercel: sin esto, req.ip sería la del proxy y
// el límite por IP contaría a todos los usuarios como uno solo.
app.set("trust proxy", 1);

// Cabeceras de seguridad antes que nada, para que apliquen a toda respuesta.
app.use(cabecerasSeguras);

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());
app.use(express.json({ limit: "10mb" }));
// El refresh token viaja en cookie httpOnly, fuera del alcance del JS del sitio.
app.use(cookieParser());

// Tope general. Los endpoints sensibles llevan además el suyo, más estricto.
app.use(limiteGeneral);

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ ok: true, status: "Consultorio VM API corriendo" })
);

// ── RUTAS ────────────────────────────────────────────────────
// Límites específicos ANTES de montar la ruta: sin ellos, /auth2/login queda
// abierto a probar contraseñas a discreción.
app.use("/auth2/login",    limiteLogin);
app.use("/auth2/registro", limiteLogin);
app.use("/auth2/recuperar", limiteCorreo);
app.use("/auth2/reenviar-verificacion", limiteCorreo);
app.use("/auth2",          autenticacionRoutes); // autenticación propia
app.use("/usuarios",       usuariosRoutes);
app.use("/procedimientos", procedimientosRoutes);
app.use("/testimonios",    testimoniosRoutes);
app.use("/citas",          citasRoutes);
app.use("/bloqueos-horas", bloqueosHorasRoutes);
app.use("/disponibilidad", disponibilidadRoutes);
app.use("/comentarios",    comentariosRoutes);
app.use("/uploads",        uploadsRoutes);
app.use("/charlas",        charlasRoutes);
app.use("/analytics",      analyticsRoutes);
app.use("/reportes",       reportesRoutes);
app.use("/configuracion",  configuracionRoutes);
app.use("/galeria-confianza", galeriaConfianzaRoutes);
app.use("/copiloto",       limiteIa, copilotoRoutes);
app.use("/",               reagendasRoutes);  // /citas/:id/solicitar-reagenda y /reagendas

// ── MANEJO GLOBAL DE ERRORES ─────────────────────────────────
app.use((err, _req, res, _next) => {
  /* Un cuerpo mal formado NO es un fallo del servidor.
   *
   * Antes todo caía aquí y salía como 500 con su traza completa en el log.
   * Dos problemas: el 500 dice "es culpa mía" cuando la petición venía
   * rota, y cualquiera podía llenar el registro de trazas mandando basura
   * a cualquier endpoint — que es ruido donde luego hay que buscar un
   * incidente de verdad.
   *
   * body-parser marca estos casos con `type: "entity.parse.failed"` (JSON
   * invalido) y `entity.too.large` (cuerpo por encima del limite). Se
   * responden con su codigo, sin traza y sin detalle: decir DONDE falla el
   * JSON le ahorra trabajo a quien esta probando el limite.
   */
  const tipo = err && err.type;
  if (tipo === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ ok: false, error: "El cuerpo de la petición no es JSON válido" });
  }
  if (tipo === "entity.too.large") {
    return res.status(413).json({ ok: false, error: "El contenido es demasiado grande" });
  }

  console.error("Error no manejado:", err);
  res.status(500).json({ ok: false, error: "Error interno del servidor" });
});

// ── INICIAR SERVIDOR ──────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Consultorio VM API corriendo en puerto ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || "development"}`);
});

// Evitar caídas por errores no capturados
process.on("uncaughtException",   (err) => console.error("uncaughtException:", err));
process.on("unhandledRejection",  (err) => console.error("unhandledRejection:", err));