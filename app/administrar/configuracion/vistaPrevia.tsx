"use client";

import { MapPin, Clock, Phone, Mail, Instagram, AlertCircle } from "lucide-react";

/**
 * Lo que las pacientes ven, armado con lo que hay escrito ahora mismo.
 *
 * POR QUÉ NO BASTABA CON EL FORMULARIO
 * Treinta campos en fila, cada uno con su etiqueta, no dicen en ningún
 * momento qué produce todo eso junto. "Edificio" y "Consultorio" son dos
 * casillas hasta que ves que forman la línea de la dirección que sale en el
 * pie de página; una vacía se nota al verla, no al leer su nombre.
 *
 * Esto es la misma información, dicha como frase en vez de como casillas.
 * Cambia mientras escribes, así que el efecto de lo que estás tocando se ve
 * sin guardar, sin abrir otra pestaña y sin recordar dónde salía.
 *
 * NO ES UNA CAPTURA DEL SITIO
 * Es un resumen fiel de los datos, no una réplica del pie de página. Imitar
 * el diseño real invitaría a ajustar aquí cosas que aquí no se deciden, y se
 * quedaría desactualizado en cuanto el sitio cambie de aspecto.
 *
 * LO QUE FALTA SE DICE
 * Un dato vacío no desaparece en silencio: sale marcado. En el sitio, un
 * campo vacío es una línea que no aparece —y eso, desde el panel, es
 * indistinguible de que todo esté bien.
 */

export default function VistaPrevia({ v }: { v: Record<string, string> }) {
  const dato = (k: string) => (v[k] || "").trim();

  const direccion = [dato("ubicacion_direccion"), dato("ubicacion_edificio"), dato("ubicacion_consultorio")]
    .filter(Boolean)
    .join(", ");
  const ciudad = [dato("ubicacion_ciudad"), dato("ubicacion_departamento")].filter(Boolean).join(" — ");

  const Falta = () => (
    <span className="cfg-previa-falta">
      <AlertCircle size={11} /> sin llenar
    </span>
  );

  const Linea = ({ icono, texto }: { icono: React.ReactNode; texto: string }) => (
    <li className="cfg-previa-linea">
      <span className="cfg-previa-icono">{icono}</span>
      {texto ? <span>{texto}</span> : <Falta />}
    </li>
  );

  return (
    <div className="cfg-previa">
      <p className="cfg-previa-eyebrow">Así te ven las pacientes</p>

      <p className="cfg-previa-nombre">
        {dato("marca_nombre") || <Falta />}
      </p>
      <p className="cfg-previa-especialidad">
        {dato("marca_especialidad") || <Falta />}
      </p>

      <ul className="cfg-previa-lista">
        <Linea icono={<MapPin size={13} />} texto={[direccion, ciudad].filter(Boolean).join(" · ")} />
        <Linea icono={<Clock size={13} />} texto={dato("horario_texto")} />
        <Linea icono={<Phone size={13} />} texto={dato("contacto_telefono_visible")} />
        <Linea icono={<Mail size={13} />} texto={dato("contacto_email")} />
        <Linea icono={<Instagram size={13} />} texto={dato("contacto_instagram")} />
      </ul>

      {/* La promoción es lo único de esta pantalla que sale en portada y
          encima grande. Merece verse aparte: es el dato que más rápido se
          queda viejo, y el que peor sienta encontrar caducado. */}
      {dato("marca_promocion_activa") === "true" && (
        <p className="cfg-previa-promo">
          En portada ahora: <strong>{dato("marca_promocion_texto") || "(sin texto)"}</strong>
        </p>
      )}

      {/* Las horas no son texto para leer, son el limite del calendario: lo
          que la paciente puede llegar a elegir al agendar. Decirlo asi evita
          la confusion entre "horario_texto", que solo informa, y estas dos,
          que si mandan. */}
      <p className="cfg-previa-agenda">
        El calendario solo ofrece citas entre las{" "}
        <strong>{dato("horario_hora_apertura") || "—"}</strong> y las{" "}
        <strong>{dato("horario_hora_cierre") || "—"}</strong>.
      </p>
    </div>
  );
}
