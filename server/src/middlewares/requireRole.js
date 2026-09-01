/**
 * Autorización por rol.
 *
 * El rol que llega en req.user lo pone verifyToken consultando `admin_users`,
 * que es la autoridad. Nunca sale de `usuarios.rol`, columna que el propio
 * usuario puede editar desde su perfil.
 *
 * DOS COSAS QUE SE QUITARON DE AQUÍ, Y POR QUÉ:
 *
 * 1. Había una puerta trasera: `if (rol === "developer") return next();`
 *    saltaba TODAS las comprobaciones de rol, en todas las rutas. Hoy no se
 *    puede explotar porque verifyToken solo devuelve "admin" o "usuario",
 *    pero es exactamente el tipo de línea que sobrevive a un refactor y
 *    reaparece cuando alguien vuelve a introducir ese rol. Un permiso
 *    universal no debe depender de una cadena de texto.
 *
 * 2. El mensaje de error decía qué rol hacía falta ("Rol requerido: admin o
 *    developer"). Eso le dibuja a un atacante el mapa de roles del sistema y
 *    le confirma que la ruta existe. Ahora el mensaje es genérico; el
 *    detalle va al log del servidor, que es donde sirve.
 */
function requireRole(allowedRoles = []) {
  if (!Array.isArray(allowedRoles)) throw new Error("requireRole espera un array");

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Usuario no autenticado" });
    }

    const { rol } = req.user;

    if (!allowedRoles.includes(rol)) {
      console.warn(
        `[auth] Acceso denegado a ${req.method} ${req.originalUrl}: ` +
        `usuario ${req.user.id} tiene rol "${rol}", se requiere uno de [${allowedRoles.join(", ")}]`
      );
      return res.status(403).json({ ok: false, error: "No tienes permiso para esta acción" });
    }

    next();
  };
}

module.exports = requireRole;
