/**
 * Middleware de autorización por roles.
 * developer siempre tiene acceso total.
 */
function requireRole(allowedRoles = []) {
  if (!Array.isArray(allowedRoles)) throw new Error("requireRole espera un array");

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Usuario no autenticado" });
    }

    const { rol } = req.user;

    if (rol === "developer") return next();

    if (!allowedRoles.includes(rol)) {
      return res.status(403).json({ ok: false, error: `Acceso denegado. Rol requerido: ${allowedRoles.join(" o ")}` });
    }

    next();
  };
}

module.exports = requireRole;