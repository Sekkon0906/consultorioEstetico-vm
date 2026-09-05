"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { getMisCitasApi } from "@/services/citasApi";
import { getConfig } from "@/lib/configuracion";
import type { Cita } from "@/types/domain";
import { aISOLocal } from "@/lib/fechas";

/**
 * La tarjeta de fidelidad: cuántos procedimientos llevas hacia el beneficio.
 *
 * INFORMA, NO APLICA
 * Esto no descuenta nada en el flujo de agendar, y es deliberado. El precio
 * final depende de la valoración —lo dice la propia web—, así que un descuento
 * automático prometería un importe que la consulta puede no confirmar, y el
 * sitio no puede saber si la doctora ya lo dio en una visita anterior. La
 * tarjeta cuenta; el descuento lo aplica ella.
 *
 * CUENTA LO MISMO QUE EL HISTORIAL
 * Solo citas `atendida` y con fecha ya pasada. Ni agendadas ni canceladas: si
 * contaran las agendadas, cualquiera reserva siete y pide el beneficio. Es la
 * misma regla que usa el historial de procedimientos, a propósito —dos
 * contadores del mismo hecho que no coincidieran serían un problema peor que
 * no tener el segundo.
 *
 * NO APARECE HASTA QUE HAY ALGO QUE CONTAR
 * Con cero procedimientos atendidos no se pinta. Una tarjeta a cero en el
 * perfil de alguien que acaba de registrarse no es un incentivo: es un hueco
 * que sobra en una pantalla que ya tiene bastante.
 *
 * Y se apaga entera poniendo el contador a 0 en la configuración, sin tocar
 * código.
 */
export default function TarjetaFidelidad() {
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [cada, setCada] = useState<number | null>(null);
  const [descuento, setDescuento] = useState(0);

  useEffect(() => {
    let vivo = true;
    Promise.all([getMisCitasApi(), getConfig()])
      .then(([cs, cfg]) => {
        if (!vivo) return;
        setCitas(cs);
        setCada(Number(cfg.fidelidad_cada) || 0);
        setDescuento(Number(cfg.fidelidad_descuento) || 0);
      })
      /* Si algo falla no se pinta nada. El perfil ya avisa de sus propios
         fallos, y una tarjeta a medias que prometa un beneficio con números
         equivocados es peor que ninguna tarjeta. */
      .catch(() => { if (vivo) { setCitas([]); setCada(0); } });
    return () => { vivo = false; };
  }, []);

  const hechos = useMemo(() => {
    if (!citas) return 0;
    const hoy = aISOLocal(new Date());
    return citas.filter((c) => c.estado === "atendida" && c.fecha <= hoy).length;
  }, [citas]);

  if (citas === null || cada === null) return null;
  if (cada <= 0 || hechos === 0) return null;

  /* El resto de la vuelta actual. Con 15 hechos y un objetivo de 7, se está
     en el 1 de la tercera vuelta, no en 15 de 7. Sin esto la barra se
     desbordaría y el mensaje diría un disparate. */
  const enLaVuelta = hechos % cada;
  const completada = enLaVuelta === 0;
  const faltan = completada ? 0 : cada - enLaVuelta;
  const marcados = completada ? cada : enLaVuelta;
  /* En qué tarjeta va. Con 15 hechos y objetivo 7 son la tercera; al
     completar la segunda (14) sigue siendo la segunda, no la tercera. */
  const numeroTarjeta = completada ? Math.floor(hechos / cada) : Math.floor(hechos / cada) + 1;
  const esLaPrimera = numeroTarjeta === 1;

  return (
    <section className="fidelidad">
      <header className="fidelidad-cabecera">
        <span className="fidelidad-icono" aria-hidden="true">
          <Gift size={18} />
        </span>
        <div>
          <h3 className="fidelidad-titulo">Tu tarjeta del consultorio</h3>
          <p className="fidelidad-sub">
            {/* Tres frases y no una, porque a partir de la segunda vuelta la
                frase de siempre miente. Con 15 procedimientos y un objetivo
                de 7 decía "al llegar a 7 tienes un 20%", cuando ya se pasó de
                7 dos veces. Los sellos ya se reiniciaban bien; era el texto
                el que no se enteraba. */}
            {completada ? (
              <>
                Completaste {esLaPrimera ? "tu tarjeta" : `tu ${numeroTarjeta}.ª tarjeta`}.{" "}
                <strong>Recuérdaselo a la doctora en tu próxima cita</strong> para
                aplicar tu {descuento}%.
              </>
            ) : esLaPrimera ? (
              <>
                Llevas <strong>{hechos}</strong>{" "}
                {hechos === 1 ? "procedimiento" : "procedimientos"}. Al llegar a{" "}
                {cada} tienes un <strong>{descuento}% de descuento</strong>.
              </>
            ) : (
              <>
                Vas por tu <strong>{numeroTarjeta}.ª tarjeta</strong>, con{" "}
                {hechos} {hechos === 1 ? "procedimiento" : "procedimientos"} en
                total. Cada {cada} tienes un{" "}
                <strong>{descuento}% de descuento</strong>.
              </>
            )}
          </p>
        </div>
      </header>

      {/* Los sellos. `aria-hidden` porque la frase de arriba ya dice el número
          exacto: un lector de pantalla leyendo siete casillas seguidas sería
          ruido sin información nueva. */}
      <div className="fidelidad-sellos" aria-hidden="true">
        {Array.from({ length: cada }).map((_, i) => (
          <span key={i} className={`fidelidad-sello ${i < marcados ? "es-marcado" : ""}`} />
        ))}
      </div>

      {!completada && (
        <p className="fidelidad-faltan">
          {faltan === 1 ? "Te falta 1 procedimiento." : `Te faltan ${faltan} procedimientos.`}
        </p>
      )}

      {/* Se dice claro que el descuento no es automático. Sin esto, alguien
          llega a la consulta esperando que ya esté aplicado. */}
      <p className="fidelidad-nota">
        Solo cuentan las citas ya atendidas. El descuento lo aplica la doctora
        en el consultorio.
      </p>
    </section>
  );
}
