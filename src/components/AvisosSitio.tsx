"use client";

import { useEffect, useState } from "react";
import { Info, AlertTriangle, Sparkles, X } from "lucide-react";

/**
 * Lo que la doctora quiera decir, dicho por ella.
 *
 * Los publica desde su Claude por el conector. Aquí solo se pintan.
 *
 * NO SE RENDERIZA NADA SI NO HAY AVISOS
 * Ni un hueco, ni un esqueleto de carga. Es un bloque que la mayor parte del
 * año está vacío: reservarle sitio dejaría un espacio en blanco permanente en
 * la portada a cambio de nada, y un esqueleto parpadeando en cada visita
 * anunciaría contenido que casi nunca llega.
 *
 * SE PUEDE CERRAR, Y SE RECUERDA
 * Un aviso que no se puede quitar deja de leerse a la tercera visita y empieza
 * a estorbar. Cerrarlo se guarda en el navegador de quien lo cerró, por
 * identificador: si mañana se publica otro, ese sí se ve.
 *
 * Se guarda por ID y no un simple "ya cerré los avisos" justamente por eso —
 * la versión perezosa silenciaría el cierre por vacaciones porque la semana
 * pasada alguien cerró una promoción.
 */

interface Aviso {
  id: number;
  titulo: string;
  cuerpo: string;
  tipo: "informativo" | "importante" | "promocion";
  hasta: string | null;
}

const ICONOS = {
  informativo: Info,
  importante: AlertTriangle,
  promocion: Sparkles,
} as const;

const CLAVE = "avisos-cerrados";

function leerCerrados(): number[] {
  /* Envuelto en try/catch: en una ventana privada, o con el almacenamiento
     del sitio bloqueado, el simple hecho de LEER lanza. Un adorno de la
     portada no puede tumbar la portada. */
  try {
    const v = localStorage.getItem(CLAVE);
    return v ? (JSON.parse(v) as number[]) : [];
  } catch {
    return [];
  }
}

export default function AvisosSitio() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cerrados, setCerrados] = useState<number[]>([]);

  useEffect(() => {
    setCerrados(leerCerrados());
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    let vivo = true;
    fetch(`${base}/avisos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Aviso[]) => { if (vivo) setAvisos(Array.isArray(d) ? d : []); })
      .catch(() => { /* Sin avisos se ve igual de bien. No hay nada que decir. */ });
    return () => { vivo = false; };
  }, []);

  const cerrar = (id: number) => {
    const nuevos = [...cerrados, id];
    setCerrados(nuevos);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nuevos.slice(-50)));
    } catch {
      /* Si no se puede guardar, el aviso vuelve en la próxima visita. Molesto,
         pero no roto: cerrarlo ya funcionó en esta. */
    }
  };

  const visibles = avisos.filter((a) => !cerrados.includes(a.id));
  if (!visibles.length) return null;

  return (
    <section className="avisos-sitio" aria-label="Avisos del consultorio">
      {visibles.map((a) => {
        const Icono = ICONOS[a.tipo] || Info;
        return (
          <article key={a.id} className={`aviso es-${a.tipo}`}>
            <span className="aviso-icono"><Icono size={17} /></span>
            <div className="aviso-texto">
              <p className="aviso-titulo">{a.titulo}</p>
              {a.cuerpo && <p className="aviso-cuerpo">{a.cuerpo}</p>}
            </div>
            <button
              type="button"
              className="aviso-cerrar"
              onClick={() => cerrar(a.id)}
              aria-label={`Cerrar el aviso: ${a.titulo}`}
            >
              <X size={15} />
            </button>
          </article>
        );
      })}
    </section>
  );
}
