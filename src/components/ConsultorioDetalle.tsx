"use client";

import { motion } from "framer-motion";
import { MUELLE_ENTRADA } from "@/lib/movimiento";
import {
  CalendarCheck,
  ClipboardCheck,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Car,
  Building2,
} from "lucide-react";

/**
 * Lo que la página del consultorio no contaba.
 *
 * QUÉ PROBLEMA RESUELVE
 * La página tenía fotos bonitas, un párrafo y un mapa. Todo lo que resuelve
 * una duda real —qué pasa el primer día, cómo se esteriliza el
 * instrumental, a qué hora abren, dónde se aparca— no estaba en ningún
 * sitio, así que acababa preguntándose por WhatsApp una y otra vez. Las
 * mismas preguntas escritas una vez.
 *
 * POR QUÉ LA PRIMERA VISITA VA LA PRIMERA
 * En medicina estética el freno no suele ser el precio: es no saber qué te
 * van a hacer. Contar los cuatro pasos con antelación quita el miedo a
 * comprometerse con algo cuyo contenido no conoces, y de paso deja claro
 * que la primera cita es una valoración y no el procedimiento.
 *
 * SOBRE LA BIOSEGURIDAD
 * Va escrita, no como galería. Las fotos de bioseguridad las sube la
 * doctora en "Por qué confiarme" de la home; aquí lo que hace falta es el
 * texto que las fotos no pueden decir —qué se hace con cada instrumento—
 * porque una foto de un autoclave no explica el protocolo.
 *
 * Los textos van en el componente y no en `messages/`: son contenido
 * médico que la doctora tendrá que revisar palabra por palabra (E3 del
 * backlog), y repartirlo en el archivo de traducciones lo vuelve más
 * difícil de leer entero. Cuando estén validados se mueven.
 */

const entra = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const PASOS = [
  {
    icono: ClipboardCheck,
    titulo: "Hablamos de lo que te preocupa",
    texto:
      "Sin prisa y sin compromiso. Cuentas qué te gustaría mejorar y se resuelven las dudas que traigas.",
  },
  {
    icono: Stethoscope,
    titulo: "Valoración médica",
    texto:
      "Se revisa tu piel, tu historia clínica y los medicamentos que tomas. De ahí sale qué es posible y qué no en tu caso.",
  },
  {
    icono: Sparkles,
    titulo: "Tu plan, con precios",
    texto:
      "Se propone un plan por etapas, con lo que cuesta cada una. Te lo llevas por escrito aunque no decidas nada ese día.",
  },
  {
    icono: CalendarCheck,
    titulo: "Agendamos cuando tú quieras",
    texto:
      "Si decides seguir, se reserva la fecha del primer procedimiento. Si prefieres pensarlo, no pasa nada.",
  },
];

const BIOSEGURIDAD = [
  {
    titulo: "Material de un solo uso",
    texto:
      "Agujas, cánulas, jeringas y guantes se abren delante de ti y se desechan después. Nunca se reutilizan.",
  },
  {
    titulo: "Esterilización en autoclave",
    texto:
      "El instrumental reutilizable pasa por lavado enzimático, empaque sellado y autoclave, con control de cada ciclo.",
  },
  {
    titulo: "Productos trazables",
    texto:
      "Todo lo que se aplica tiene registro sanitario INVIMA. Se te muestra el lote y la fecha de vencimiento antes de usarlo.",
  },
  {
    titulo: "Desinfección entre pacientes",
    texto:
      "Camilla, superficies y equipos se desinfectan después de cada persona, y hay tiempo reservado entre citas para hacerlo bien.",
  },
];

const HORARIOS = [
  { dia: "Lunes a viernes", horas: "8:00 a. m. – 6:00 p. m." },
  { dia: "Sábados", horas: "8:00 a. m. – 1:00 p. m." },
  { dia: "Domingos y festivos", horas: "Cerrado" },
];

const LLEGAR = [
  {
    icono: Building2,
    titulo: "El edificio",
    texto:
      "Edificio Torre Empresarial, Carrera 5.ª #11-24. Consultorio 502, quinto piso. Hay ascensor.",
  },
  {
    icono: Car,
    titulo: "Dónde dejar el carro",
    texto:
      "Parqueadero público a media cuadra. En horas de la mañana suele haber sitio sobre la carrera 5.ª.",
  },
  {
    icono: MapPin,
    titulo: "Cómo reconocerlo",
    texto:
      "Estás en pleno centro de Ibagué, a dos cuadras de la plaza de Bolívar. En la entrada hay portería.",
  },
];

function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "2.6rem" }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.6rem, 3.4vw, 2.3rem)",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: sub ? "0.6rem" : 0,
        }}
      >
        {children}
      </h2>
      {sub && (
        <p
          style={{
            color: "var(--text-soft)",
            fontSize: "0.98rem",
            maxWidth: "var(--ancho-texto)",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function ConsultorioDetalle() {
  return (
    <div style={{ maxWidth: "var(--ancho-contenido)", margin: "0 auto", padding: "0 1.5rem" }}>

      {/* ── Qué esperar en tu primera visita ── */}
      <section style={{ padding: "3.5rem 0" }}>
        <Titulo sub="La primera cita es una valoración: se mira, se conversa y se planifica. No se hace ningún procedimiento sin que lo hayas decidido tú.">
          Qué esperar en tu primera visita
        </Titulo>

        <ol className="cons-pasos">
          {PASOS.map((paso, i) => {
            const Icono = paso.icono;
            return (
              <motion.li
                key={paso.titulo}
                variants={entra}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ ...MUELLE_ENTRADA, delay: i * 0.07 }}
                className="cons-paso"
              >
                <span className="cons-paso-num">{i + 1}</span>
                <Icono size={22} color="var(--brand)" style={{ marginBottom: "0.7rem" }} />
                <h3 className="cons-paso-titulo">{paso.titulo}</h3>
                <p className="cons-paso-texto">{paso.texto}</p>
              </motion.li>
            );
          })}
        </ol>
      </section>

      {/* ── Bioseguridad ── */}
      <section style={{ padding: "3.5rem 0" }}>
        <Titulo sub="Lo que no se ve en las fotos y es lo que más importa.">
          <ShieldCheck size={26} style={{ display: "inline", marginRight: 10, verticalAlign: "-4px" }} />
          Bioseguridad y esterilización
        </Titulo>

        <div className="cons-bio">
          {BIOSEGURIDAD.map((b, i) => (
            <motion.div
              key={b.titulo}
              variants={entra}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ ...MUELLE_ENTRADA, delay: i * 0.06 }}
              className="cons-bio-item"
            >
              <h3 className="cons-bio-titulo">{b.titulo}</h3>
              <p className="cons-bio-texto">{b.texto}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Horarios y cómo llegar ── */}
      <section style={{ padding: "3.5rem 0" }}>
        <div className="cons-doble">
          <div className="cons-horarios">
            <h3 className="cons-sub">
              <Clock size={19} color="var(--brand)" /> Horarios de atención
            </h3>
            <dl className="cons-horario-lista">
              {HORARIOS.map((h) => (
                <div key={h.dia} className="cons-horario-fila">
                  <dt>{h.dia}</dt>
                  <dd>{h.horas}</dd>
                </div>
              ))}
            </dl>
            <p className="cons-nota">
              La agenda de la web muestra las horas realmente libres, así que
              es la fuente fiable para reservar.
            </p>
          </div>

          <div className="cons-llegar">
            <h3 className="cons-sub">
              <MapPin size={19} color="var(--brand)" /> Cómo llegar
            </h3>
            <ul className="cons-llegar-lista">
              {LLEGAR.map((l) => {
                const Icono = l.icono;
                return (
                  <li key={l.titulo}>
                    <Icono size={17} color="var(--brand)" />
                    <div>
                      <strong>{l.titulo}</strong>
                      <span>{l.texto}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <style>{`
        .cons-pasos {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
          gap: 1.1rem;
        }
        .cons-paso {
          position: relative;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.6rem 1.3rem 1.4rem;
        }
        .cons-paso-num {
          position: absolute;
          top: 1.1rem;
          right: 1.2rem;
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1;
          /* Muy tenue a propósito: ordena la lectura sin competir con el
             título del paso, que es lo que hay que leer. */
          color: var(--brand);
          opacity: 0.22;
        }
        .cons-paso-titulo {
          font-family: 'Playfair Display', serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 0.4rem;
          line-height: 1.3;
          padding-right: 1.6rem;
        }
        .cons-paso-texto {
          font-size: 0.87rem;
          color: var(--text-soft);
          line-height: 1.6;
          margin: 0;
        }

        .cons-bio {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(265px, 1fr));
          gap: 1.1rem;
        }
        .cons-bio-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--brand);
          border-radius: 14px;
          padding: 1.2rem 1.3rem;
        }
        .cons-bio-titulo {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 0.35rem;
        }
        .cons-bio-texto {
          font-size: 0.87rem;
          color: var(--text-soft);
          line-height: 1.6;
          margin: 0;
        }

        .cons-doble {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.6rem;
          align-items: start;
        }
        .cons-horarios,
        .cons-llegar {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.6rem;
        }
        .cons-sub {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 1.1rem;
        }
        .cons-horario-lista { margin: 0; }
        .cons-horario-fila {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--border);
        }
        .cons-horario-fila:last-of-type { border-bottom: none; }
        .cons-horario-fila dt {
          font-size: 0.9rem;
          color: var(--text-soft);
          font-weight: 500;
          margin: 0;
        }
        .cons-horario-fila dd {
          font-size: 0.9rem;
          color: var(--text);
          font-weight: 700;
          margin: 0;
          text-align: right;
        }
        .cons-nota {
          margin: 1rem 0 0;
          font-size: 0.79rem;
          color: var(--text-muted);
          line-height: 1.55;
        }

        .cons-llegar-lista {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1.05rem;
        }
        .cons-llegar-lista li {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .cons-llegar-lista li > svg { flex-shrink: 0; margin-top: 3px; }
        .cons-llegar-lista strong {
          display: block;
          font-size: 0.92rem;
          color: var(--text);
          margin-bottom: 0.15rem;
        }
        .cons-llegar-lista span {
          font-size: 0.86rem;
          color: var(--text-soft);
          line-height: 1.55;
        }

        @media (prefers-reduced-motion: reduce) {
          .cons-paso, .cons-bio-item { transform: none !important; }
        }
      `}</style>
    </div>
  );
}
