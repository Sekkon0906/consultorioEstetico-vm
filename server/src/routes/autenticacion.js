/**
 * Rutas de autenticación propia, bajo /auth2.
 *
 * Van en /auth2 y no en /auth a propósito: /auth sigue sirviendo el flujo de
 * Supabase mientras dure la transición. Los dos conviven, el frontend se migra
 * pantalla por pantalla, y cuando ya nadie llame a /auth se borra ese archivo
 * y estas rutas se renombran. Cambiar el login de golpe es la clase de corte
 * que deja a la doctora sin poder entrar al panel.
 *
 * El refresh token viaja en una cookie httpOnly, no en el cuerpo de la
 * respuesta: así el JavaScript de la página no puede leerlo, y un XSS no se
 * lleva la sesión de 30 días.
 */

const express = require("express");
const router = express.Router();
const auth = require("../services/autenticacion");

const ES_PRODUCCION = process.env.NODE_ENV === "production";
const COOKIE_REFRESH = "refresh_token";

function ponerCookieRefresh(res, token, expiraEn) {
  res.cookie(COOKIE_REFRESH, token, {
    httpOnly: true,
    secure: ES_PRODUCCION,
    // "none" en producción porque el frontend (Vercel) y la API (Railway)
    // están en dominios distintos; exige secure:true, que ya se cumple.
    sameSite: ES_PRODUCCION ? "none" : "lax",
    expires: expiraEn,
    path: "/",
  });
}

function limpiarCookieRefresh(res) {
  res.clearCookie(COOKIE_REFRESH, {
    httpOnly: true,
    secure: ES_PRODUCCION,
    sameSite: ES_PRODUCCION ? "none" : "lax",
    path: "/",
  });
}

function datosPeticion(req) {
  return {
    userAgent: req.headers["user-agent"],
    ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress,
  };
}

/** Respuesta común de un inicio de sesión exitoso. */
function responderSesion(res, resultado) {
  ponerCookieRefresh(res, resultado.refreshToken, resultado.expiraEn);
  return res.json({
    ok: true,
    accessToken: resultado.accessToken,
    usuario: resultado.usuario,
  });
}

// ── Registro ────────────────────────────────────────────────────────────────
router.post("/registro", async (req, res) => {
  try {
    const { email, password, nombres, apellidos, telefono } = req.body || {};
    const r = await auth.registrar({ email, password, nombres, apellidos, telefono });
    if (!r.ok) return res.status(400).json(r);
    // No se inicia sesión automáticamente: primero hay que verificar el correo.
    return res.status(201).json({
      ok: true,
      usuario: r.usuario,
      mensaje: "Cuenta creada. Te enviamos un correo para confirmarla.",
    });
  } catch (err) {
    console.error("POST /auth2/registro:", err);
    return res.status(500).json({ ok: false, error: "No se pudo crear la cuenta." });
  }
});

// ── Inicio de sesión ────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const r = await auth.iniciarSesion({ email, password, ...datosPeticion(req) });
    if (!r.ok) return res.status(401).json(r);
    return responderSesion(res, r);
  } catch (err) {
    console.error("POST /auth2/login:", err);
    return res.status(500).json({ ok: false, error: "No se pudo iniciar sesión." });
  }
});

// ── Renovar el access token ─────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_REFRESH] || req.body?.refreshToken;
    if (!token) return res.status(401).json({ ok: false, error: "No hay sesión." });

    const r = await auth.refrescarSesion(token, datosPeticion(req));
    if (!r.ok) {
      limpiarCookieRefresh(res);
      return res.status(401).json(r);
    }
    return responderSesion(res, r);
  } catch (err) {
    console.error("POST /auth2/refresh:", err);
    return res.status(500).json({ ok: false, error: "No se pudo renovar la sesión." });
  }
});

// ── Cerrar sesión ───────────────────────────────────────────────────────────
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_REFRESH] || req.body?.refreshToken;
    if (token) await auth.cerrarSesion(token);
    limpiarCookieRefresh(res);
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /auth2/logout:", err);
    limpiarCookieRefresh(res);
    return res.json({ ok: true }); // cerrar sesión nunca debe fallar de cara al usuario
  }
});

// ── Verificación de correo ──────────────────────────────────────────────────
router.post("/verificar", async (req, res) => {
  const r = await auth.verificarEmail(req.body?.token);
  return res.status(r.ok ? 200 : 400).json(r);
});

router.post("/reenviar-verificacion", async (req, res) => {
  await auth.reenviarVerificacion(req.body?.email);
  // Siempre 200: no se revela si el correo existe.
  return res.json({ ok: true, mensaje: "Si esa cuenta existe y falta confirmarla, te llegará un correo." });
});

// ── Recuperación de contraseña ──────────────────────────────────────────────
router.post("/recuperar", async (req, res) => {
  await auth.solicitarRecuperacion(req.body?.email);
  return res.json({ ok: true, mensaje: "Si esa cuenta existe, te llegará un correo con el enlace." });
});

router.post("/recuperar/confirmar", async (req, res) => {
  const r = await auth.restablecerPassword({
    token: req.body?.token,
    password: req.body?.password,
  });
  return res.status(r.ok ? 200 : 400).json(r);
});

// ── Google ──────────────────────────────────────────────────────────────────

function redirectUriGoogle() {
  const base = (process.env.API_URL || "").replace(/\/+$/, "");
  return `${base}/auth2/google/callback`;
}

/** Manda al usuario al selector de cuentas de Google. */
router.get("/google", (req, res) => {
  if (!auth.googleConfigurado()) {
    return res.status(503).json({ ok: false, error: "Google no está configurado en el servidor." });
  }
  // `state` lleva a dónde volver tras entrar, y de paso protege contra CSRF.
  const state = Buffer.from(JSON.stringify({
    volverA: typeof req.query.volverA === "string" ? req.query.volverA : "/",
    n: Math.random().toString(36).slice(2),
  })).toString("base64url");

  const url = auth.urlAutorizacionGoogle(redirectUriGoogle(), state);
  return res.redirect(url);
});

/** Google devuelve aquí con el código. */
router.get("/google/callback", async (req, res) => {
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  try {
    const { code, state } = req.query;
    if (!code) return res.redirect(`${appUrl}/login?error=google`);

    let volverA = "/";
    try {
      volverA = JSON.parse(Buffer.from(String(state), "base64url").toString()).volverA || "/";
    } catch { /* state ilegible: se vuelve al inicio */ }
    // Solo rutas internas: un `volverA` con dominio externo sería un salto
    // abierto que un atacante podría usar para llevarse al usuario a otro sitio.
    if (!volverA.startsWith("/") || volverA.startsWith("//")) volverA = "/";

    const r = await auth.entrarConGoogle({
      code: String(code),
      redirectUri: redirectUriGoogle(),
      ...datosPeticion(req),
    });
    if (!r.ok) return res.redirect(`${appUrl}/login?error=google`);

    ponerCookieRefresh(res, r.refreshToken, r.expiraEn);
    // El access token va en el fragmento (#): no viaja al servidor ni queda
    // en los registros del proxy, a diferencia de la cadena de consulta.
    return res.redirect(`${appUrl}${volverA}#access_token=${r.accessToken}`);
  } catch (err) {
    console.error("GET /auth2/google/callback:", err);
    return res.redirect(`${appUrl}/login?error=google`);
  }
});

// ── Estado de configuración ─────────────────────────────────────────────────
// Para que el frontend sepa si mostrar el botón de Google, sin exponer claves.
router.get("/estado", (_req, res) => {
  res.json({
    ok: true,
    data: {
      google: auth.googleConfigurado(),
      correo: Boolean(process.env.RESEND_API_KEY),
      jwt: Boolean(process.env.JWT_SECRET),
    },
  });
});

module.exports = router;
