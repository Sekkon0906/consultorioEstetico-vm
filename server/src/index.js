require("dotenv").config();

const express = require("express");
const cors    = require("cors");

const authRoutes         = require("./routes/auth");
const usuariosRoutes     = require("./routes/usuarios");
const procedimientosRoutes = require("./routes/procedimientos");
const testimoniosRoutes  = require("./routes/testimonios");
const citasRoutes        = require("./routes/citas");
const bloqueosHorasRoutes = require("./routes/bloqueosHoras");
const charlasRoutes      = require("./routes/charlas");
const analyticsRoutes    = require("./routes/analytics");
const reportesRoutes     = require("./routes/reportes");
const reagendasRoutes    = require("./routes/reagendas");

const app = express();

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

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ ok: true, status: "Consultorio VM API corriendo" })
);

// ── RUTAS ────────────────────────────────────────────────────
app.use("/auth",           authRoutes);
app.use("/usuarios",       usuariosRoutes);
app.use("/procedimientos", procedimientosRoutes);
app.use("/testimonios",    testimoniosRoutes);
app.use("/citas",          citasRoutes);
app.use("/bloqueos-horas", bloqueosHorasRoutes);
app.use("/charlas",        charlasRoutes);
app.use("/analytics",      analyticsRoutes);
app.use("/reportes",       reportesRoutes);
app.use("/",               reagendasRoutes);  // /citas/:id/solicitar-reagenda y /reagendas

// ── MANEJO GLOBAL DE ERRORES ─────────────────────────────────
app.use((err, _req, res, _next) => {
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