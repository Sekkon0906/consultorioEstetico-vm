process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:testpw@127.0.0.1:5432/auth_test";
process.env.JWT_SECRET   = "secreto-prueba";
process.env.PORT         = "4599";
process.env.CORS_ORIGIN  = "http://localhost:3000";
require("../src/index.js");

const BASE = "http://127.0.0.1:4599";
const post = (ruta, cuerpo) => fetch(BASE + ruta, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cuerpo),
});

setTimeout(async () => {
  let fallos = 0;
  const check = (c, m) => { console.log((c ? "  OK    " : "  FALLA ") + m); if (!c) fallos++; };

  // Cabeceras de seguridad
  const h = await fetch(BASE + "/health");
  check(h.headers.get("x-content-type-options") === "nosniff",
        "manda X-Content-Type-Options: nosniff");
  check(!!h.headers.get("strict-transport-security"), "manda Strict-Transport-Security");
  check(h.headers.get("x-powered-by") === null,
        "oculta X-Powered-By (no revela que es Express)");

  // Fuerza bruta contra el login
  let bloqueado = false, codigos = [];
  for (let i = 0; i < 14; i++) {
    const r = await post("/auth2/login", { email: "victima@x.com", password: "intento" + i });
    codigos.push(r.status);
    if (r.status === 429) { bloqueado = true; break; }
  }
  check(bloqueado, `corta la fuerza bruta con 429 (códigos: ${codigos.join(",")})`);

  // Rutas protegidas sin token
  const sinToken = await fetch(BASE + "/copiloto/config");
  check(sinToken.status === 401, "rechaza /copiloto/config sin token (401)");
  const citasSin = await fetch(BASE + "/citas");
  check([401, 403].includes(citasSin.status), "rechaza /citas sin token");

  // Token inventado
  const falso = await fetch(BASE + "/copiloto/config", {
    headers: { Authorization: "Bearer inventado.no.valido" },
  });
  check(falso.status === 401, "rechaza un token inventado (401)");

  console.log(fallos === 0 ? "\nSEGURIDAD: TODAS PASAN" : `\nSEGURIDAD: ${fallos} FALLAN`);
  process.exit(fallos === 0 ? 0 : 1);
}, 1500);
