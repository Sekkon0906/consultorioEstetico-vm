"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import VueloAlCarrito, { type Vuelo } from "@/components/VueloAlCarrito";

/**
 * La selección de procedimientos que el paciente quiere agendar.
 *
 * SE LLAMA "SELECCIÓN", NO "CARRITO", EN LA INTERFAZ
 * Aquí no se paga nada ni se confirma nada de golpe: cada procedimiento
 * lleva su propio día y su propia hora, y la doctora los acepta por
 * separado. Un carrito de la compra promete un "finalizar compra" —un
 * momento en el que todo lo que metiste se paga y se entrega junto— que en
 * una consulta médica no existe. Por dentro es un carrito de toda la vida;
 * hacia fuera se presenta como lo que realmente es: una lista de lo que te
 * interesa, para no perderla mientras navegas.
 *
 * Ver `Decisiones/006` en la bóveda.
 *
 * POR QUÉ VIVE EN localStorage Y NO EN EL SERVIDOR
 * La selección se hace antes de tener que identificarse, y muchas veces
 * antes de decidir nada. Guardarla en el servidor obligaría a pedir cuenta
 * para mirar precios, que es justo la fricción que se quiere evitar.
 * Sobrevive a recargas y a cerrar la pestaña, que es lo que hace falta.
 *
 * El acceso a `localStorage` va siempre en try/catch: en una ventana
 * privada, o con las cookies de sitio bloqueadas, el propio getter LANZA.
 * Sin el catch, la página entera se cae por no poder leer una lista de
 * deseos.
 */

const CLAVE = "seleccion-procedimientos";

export interface ItemSeleccion {
  id: number | string;
  nombre: string;
  precio?: string | number;
  imagen?: string;
}

interface CarritoValor {
  items: ItemSeleccion[];
  /** Cuántos hay. Se expone aparte para que la insignia no dependa del array. */
  total: number;
  /** Devuelve false si ya estaba: quien llama decide si animar o avisar. */
  añadir: (item: ItemSeleccion) => boolean;
  quitar: (id: number | string) => void;
  vaciar: () => void;
  tiene: (id: number | string) => boolean;
  /**
   * Sube de 0 a 1 cada vez que se añade algo. La insignia del navbar lo usa
   * para temblar. Es un contador y no un booleano a propósito: con un
   * booleano, añadir dos cosas seguidas no vuelve a disparar la animación
   * porque el valor no cambia.
   */
  pulso: number;
  /**
   * La insignia del navbar se registra aquí para que las tarjetas sepan
   * hacia dónde lanzar el círculo. Es un callback ref y no una posición
   * fija porque la insignia se mueve: la barra se encoge al hacer scroll y
   * cambia de sitio entre móvil y escritorio. Se pregunta su posición en
   * el momento del disparo, no antes.
   */
  registrarAncla: (el: HTMLElement | null) => void;
  /** Lanza el círculo desde el elemento pulsado hasta la insignia. */
  volarDesde: (origen: HTMLElement | null) => void;
}

const Ctx = createContext<CarritoValor | null>(null);

function leer(): ItemSeleccion[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  // Arranca vacío en los dos lados. Leer localStorage en el estado inicial
  // haría que el servidor renderizara una lista vacía y el cliente una
  // llena: React lo detecta como desajuste de hidratación y descarta el
  // árbol. Se lee en el efecto, ya en el cliente.
  const [items, setItems] = useState<ItemSeleccion[]>([]);
  const [listo, setListo] = useState(false);
  const [pulso, setPulso] = useState(0);

  useEffect(() => {
    setItems(leer());
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return; // no pisar lo guardado con el [] del primer render
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      // Sin espacio o sin permiso. La selección sigue funcionando en esta
      // pestaña; solo no sobrevive a la recarga.
    }
  }, [items, listo]);

  // Si el paciente tiene el sitio abierto en dos pestañas, las dos ven lo
  // mismo. `storage` solo dispara en las OTRAS pestañas, así que no hay
  // bucle con el efecto de guardado de arriba.
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === CLAVE) setItems(leer());
    };
    window.addEventListener("storage", alCambiar);
    return () => window.removeEventListener("storage", alCambiar);
  }, []);

  const añadir = useCallback((item: ItemSeleccion) => {
    let nuevo = false;
    setItems((prev) => {
      if (prev.some((x) => String(x.id) === String(item.id))) return prev;
      nuevo = true;
      return [...prev, item];
    });
    if (nuevo) setPulso((p) => p + 1);
    return nuevo;
  }, []);

  const quitar = useCallback((id: number | string) => {
    setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  /* === EL VUELO === */
  const ancla = useRef<HTMLElement | null>(null);
  const [vuelo, setVuelo] = useState<Vuelo | null>(null);
  const contador = useRef(0);

  const registrarAncla = useCallback((el: HTMLElement | null) => {
    ancla.current = el;
  }, []);

  const volarDesde = useCallback((origen: HTMLElement | null) => {
    const destino = ancla.current;
    // Sin insignia visible —móvil con el menú cerrado, o el navbar aún sin
    // montar— no hay a dónde volar. El item se añade igual: la animación es
    // un adorno, no el mecanismo.
    if (!origen || !destino) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const a = origen.getBoundingClientRect();
    const b = destino.getBoundingClientRect();
    contador.current += 1;
    setVuelo({
      clave: contador.current,
      desde: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
      hasta: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
    });
  }, []);

  const limpiarVuelo = useCallback(() => setVuelo(null), []);

  const valor = useMemo<CarritoValor>(
    () => ({
      items,
      total: items.length,
      añadir,
      quitar,
      vaciar,
      tiene: (id) => items.some((x) => String(x.id) === String(id)),
      pulso,
      registrarAncla,
      volarDesde,
    }),
    [items, añadir, quitar, vaciar, pulso, registrarAncla, volarDesde]
  );

  return (
    <Ctx.Provider value={valor}>
      {children}
      <VueloAlCarrito vuelo={vuelo} alTerminar={limpiarVuelo} />
    </Ctx.Provider>
  );
}

export function useCarrito() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCarrito fuera de <CarritoProvider>");
  return v;
}
