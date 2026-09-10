"use client";

import { useEffect, useState } from "react";
import { Plug, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { apiAuth } from "@/lib/apiCliente";

/**
 * Los programas conectados al consultorio, y el botón para cortarlos.
 *
 * POR QUÉ EXISTE ESTA PANTALLA
 * La pantalla de autorización le dice a la doctora "puedes retirar el acceso
 * cuando quieras desde el panel". Sin esto, esa frase promete algo que no se
 * puede hacer, y el único remedio ante una sospecha sería llamar a alguien.
 *
 * Poder revocar no es un extra de una pantalla de permisos: es la mitad que
 * hace que la otra mitad se pueda conceder con tranquilidad.
 *
 * REVOCAR NO PIDE CONFIRMACIÓN
 * Al revés de lo habitual, y a propósito. Lo reversible aquí es cortar —se
 * vuelve a autorizar en dos clics—; lo que no tiene vuelta es dejar vivo un
 * acceso del que se sospecha. Cuando alguien viene a esta pantalla a cortar
 * algo, suele venir con prisa.
 */

interface Conexion {
  client_id: string;
  nombre: string;
  desde: string;
  vivos: string;
}

export default function ConexionesLista() {
  const [conexiones, setConexiones] = useState<Conexion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cortando, setCortando] = useState<string | null>(null);

  const cargar = () => {
    apiAuth<Conexion[]>("/mcp/consentimiento/conexiones")
      .then(setConexiones)
      .catch(() => setError("No se pudieron leer las conexiones."));
  };

  useEffect(cargar, []);

  const cortar = async (clientId: string) => {
    setCortando(clientId);
    try {
      await apiAuth(`/mcp/consentimiento/conexiones/${encodeURIComponent(clientId)}`, {
        method: "DELETE",
        clave: "",
      });
      /* Se quita de la lista al instante en vez de recargar. La respuesta ya
         confirmó que se revocó; volver a pedir la lista solo añade una espera
         en la que la fila sigue ahí, y eso se lee como que no funcionó. */
      setConexiones((prev) => (prev || []).filter((c) => c.client_id !== clientId));
    } catch {
      setError("No se pudo retirar el acceso. Inténtalo otra vez.");
    } finally {
      setCortando(null);
    }
  };

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section>
      <h1 className="conexiones-titulo">
        <Plug size={20} color="var(--brand-texto)" /> Programas conectados
      </h1>
      {/* Dice exactamente lo mismo que la pantalla de autorización, y a
          propósito: si las dos describen el mismo permiso con palabras
          distintas, la doctora no sabe cuál creer, y la que recuerde será la
          que menos le preocupe. Ambas están comprobadas contra
          `ia/herramientas.js`. */}
      <p className="conexiones-intro">
        Aplicaciones a las que le diste permiso para manejar tu consultorio.
        Pueden ver y cambiar procedimientos, precios, promociones y la
        información del sitio, y consultar cuántas citas tienes y las de un
        día concreto —nombre, hora y procedimiento—.{" "}
        <strong>Nunca ven el teléfono ni el correo</strong> de tus pacientes,
        ni sus historias clínicas.
      </p>

      {error && <p className="conexiones-error">{error}</p>}

      {conexiones === null && !error && (
        <p className="conexiones-cargando">
          <Loader2 size={16} /> Cargando…
        </p>
      )}

      {conexiones?.length === 0 && (
        <div className="conexiones-vacio">
          <ShieldCheck size={26} color="var(--brand-texto)" />
          <p><strong>No hay ningún programa conectado.</strong></p>
          <p>
            Para conectar Claude, añade este consultorio como conector desde tu
            aplicación de Claude. Te traerá a una pantalla donde autorizas.
          </p>
        </div>
      )}

      {conexiones?.map((c) => (
        <div key={c.client_id} className="conexion-fila">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="conexion-nombre">{c.nombre || c.client_id}</p>
            <p className="conexion-detalle">
              Conectado desde el {fecha(c.desde)}
            </p>
          </div>
          <button
            type="button"
            className="conexion-cortar"
            onClick={() => void cortar(c.client_id)}
            disabled={cortando === c.client_id}
          >
            {cortando === c.client_id ? (
              <Loader2 size={14} style={{ animation: "conexion-gira 900ms linear infinite" }} />
            ) : (
              <Trash2 size={14} />
            )}
            {cortando === c.client_id ? "Retirando…" : "Retirar acceso"}
          </button>
        </div>
      ))}

      <style>{`@keyframes conexion-gira { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
