process.env.DATABASE_URL = "postgres://postgres:testpw@127.0.0.1:5432/auth_test";
process.env.JWT_SECRET   = "secreto-solo-para-esta-prueba-no-produccion";
const auth = require("../src/services/autenticacion");
const { pool } = require("../src/lib/db");

(async () => {
  const email = "paciente.prueba@ejemplo.com";
  let fallos = 0;
  const check = (cond, msg) => { console.log((cond?"  OK   ":"  FALLA ") + msg); if(!cond) fallos++; };

  // 1. Registro
  const reg = await auth.registrar({ email, password: "claveSegura123", nombres: "Ana", apellidos: "Gómez" });
  check(reg.ok, "registra una cuenta nueva");
  check(reg.usuario?.rol === "usuario", "el rol por defecto es 'usuario', no admin");

  // 2. No permite duplicados
  const dup = await auth.registrar({ email, password: "otraClave123" });
  check(!dup.ok, "rechaza correo duplicado");

  // 3. Contraseña corta
  const corta = await auth.registrar({ email: "b@b.com", password: "123" });
  check(!corta.ok, "rechaza contraseña de menos de 8 caracteres");

  // 4. Login correcto
  const login = await auth.iniciarSesion({ email, password: "claveSegura123" });
  check(login.ok && login.accessToken, "inicia sesión con la clave correcta");

  // 5. Login incorrecto
  const malo = await auth.iniciarSesion({ email, password: "claveEquivocada" });
  check(!malo.ok, "rechaza la clave equivocada");
  const inexistente = await auth.iniciarSesion({ email: "nadie@x.com", password: "loquesea" });
  check(!inexistente.ok && inexistente.error === malo.error,
        "mismo mensaje exista o no la cuenta (no revela correos registrados)");

  // 6. El access token es verificable
  const carga = auth.verificarAccessToken(login.accessToken);
  check(carga.sub === login.usuario.id, "el access token identifica al usuario");

  // 7. Refresh rota el token
  const ref = await auth.refrescarSesion(login.refreshToken);
  check(ref.ok && ref.refreshToken !== login.refreshToken, "el refresh rota el token");
  const reuso = await auth.refrescarSesion(login.refreshToken);
  check(!reuso.ok, "el refresh viejo ya no sirve (no se puede reusar)");

  // 8. El refresh NO se guarda en claro
  const { rows } = await pool.query("SELECT token_hash FROM sesiones LIMIT 1");
  check(rows[0].token_hash !== login.refreshToken && rows[0].token_hash.length === 64,
        "el refresh se guarda hasheado, nunca en claro");

  // 9. Recuperación de contraseña
  const { rows: u } = await pool.query("SELECT id FROM usuarios WHERE email=$1", [email]);
  const tokenRec = await require("crypto").randomBytes(1) && null;
  await auth.solicitarRecuperacion(email);
  const { rows: tk } = await pool.query(
    "SELECT token_hash FROM tokens_unicos WHERE user_id=$1 AND proposito='recuperar_password'", [u[0].id]);
  check(tk.length === 1, "genera token de recuperación");
  check(tk[0].token_hash.length === 64, "el token de recuperación también va hasheado");

  // 10. Recuperación con token inválido
  const mala = await auth.restablecerPassword({ token: "inventado", password: "nuevaClave123" });
  check(!mala.ok, "rechaza token de recuperación inválido");

  // 11. Rol viene de admin_users, no de usuarios.rol
  await pool.query("UPDATE usuarios SET rol='admin' WHERE id=$1", [u[0].id]);
  const perfil = await auth.perfilPublico(u[0].id);
  check(perfil.rol === "usuario",
        "editar usuarios.rol NO da admin (la autoridad es admin_users)");
  await pool.query("INSERT INTO admin_users (uid) VALUES ($1)", [u[0].id]);
  const perfil2 = await auth.perfilPublico(u[0].id);
  check(perfil2.rol === "admin", "estar en admin_users SÍ da admin");

  console.log(fallos === 0 ? "\nTODAS LAS PRUEBAS PASAN" : `\n${fallos} PRUEBAS FALLARON`);
  await pool.end();
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
