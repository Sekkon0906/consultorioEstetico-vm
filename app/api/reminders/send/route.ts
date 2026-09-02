// GET/POST /api/reminders/send
//
// El cron de Vercel solo puede llamar rutas del propio despliegue de Next.
// Esta ruta es un proxy fino: reenvía la petición al backend
// (POST <API>/citas/recordatorios), que es quien tiene la base y Resend.
//
// Envs:
//   - CRON_SECRET  — el mismo valor en Vercel y en el backend.
//   - API_URL / NEXT_PUBLIC_API_URL — URL del backend Express.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(req: Request) {
  const secreto = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secreto || auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const api = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");

  const dry = new URL(req.url).searchParams.get("dry") === "1" ? "?dry=1" : "";

  try {
    const r = await fetch(`${api}/citas/recordatorios${dry}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secreto}` },
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "proxy failed" },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
