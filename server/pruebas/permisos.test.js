process.env.DATABASE_URL = "postgres://postgres:testpw@127.0.0.1:5432/auth_test";
process.env.JWT_SECRET   = "secreto-prueba";
process.env.PORT         = "4601";
require("../src/index.js");
const { pool } = require("../src/lib/db");
const auth = require("../src/services/autenticacion");

const BASE = "http://127.0.0.1:4601";

setTimeout(async () => {
  let fallos = 0;
  const check = (c, m) => { console.log((c ? "  OK    " : "  FALLA ") + m); if (!c) fallos++; };

  // Dos pacientes distintos.
  for (const e of ["ana@x.com", "beto@x.com"]) {
    await pool.query("DELETE FROM citas WHERE correo=$1", [e]);
    await pool.query("DELETE FROM usuarios WHERE email=$1", [e]);
    await auth.registrar({ email: e, password: "claveLarga123", nombres: e[0] });
  }
  const ana  = await auth.iniciarSesion({ email: "ana@x.com",  password: "claveLarga123" });
  const beto = await auth.iniciarSesion({ email: "beto@x.com", password: "claveLarga123" });

  // Una cita de Ana.
  const { rows } = await pool.query(
    `INSERT INTO citas (user_id,nombres,apellidos,telefono,correo,procedimiento,fecha,hora)
     VALUES ($1,'Ana','G','300','ana@x.com','Limpieza','2027-01-05','10:00 AM') RETURNING id`,
    [ana.usuario.id]
  );
  const citaDeAna = rows[0].id;

  const get = (t) => fetch(BASE + "/citas", { headers: { Authorization: "Bearer " + t } });
  const put = (t, id, body) => fetch(`${BASE}/citas/${id}`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 1. Beto NO debe ver las citas de Ana
  const listaBeto = await (await get(beto.accessToken)).json();
  check(listaBeto.citas.length === 0,
        `un paciente no ve citas ajenas (vio ${listaBeto.citas.length})`);

  // 2. Ana SÍ ve la suya
  const listaAna = await (await get(ana.accessToken)).json();
  check(listaAna.citas.length === 1, "un paciente sí ve las suyas");

  // 3. Beto NO puede cancelar la cita de Ana
  const r3 = await put(beto.accessToken, citaDeAna, { estado: "cancelada" });
  check(r3.status === 404, `no puede cancelar cita ajena (status ${r3.status})`);
  const { rows: e3 } = await pool.query("SELECT estado FROM citas WHERE id=$1", [citaDeAna]);
  check(e3[0].estado !== "cancelada", "la cita ajena sigue sin cancelar");

  // 4. Beto NO puede reescribir montos (la rama de admin)
  const r4 = await put(beto.accessToken, citaDeAna, { monto: 1, pagado: true });
  check(r4.status === 403, `no puede editar montos de una cita (status ${r4.status})`);

  // 5. El error no revela la estructura de roles
  const r5 = await fetch(BASE + "/copiloto/config", { headers: { Authorization: "Bearer " + beto.accessToken } });
  const c5 = await r5.json();
  check(!/developer|admin/i.test(c5.error || ""),
        `el 403 no nombra los roles ("${c5.error}")`);

  // Limpieza
  await pool.query("DELETE FROM citas WHERE correo IN ('ana@x.com','beto@x.com')");
  await pool.query("DELETE FROM usuarios WHERE email IN ('ana@x.com','beto@x.com')");

  console.log(fallos === 0 ? "\nPERMISOS: TODAS PASAN" : `\nPERMISOS: ${fallos} FALLAN`);
  process.exit(fallos === 0 ? 0 : 1);
}, 1500);
