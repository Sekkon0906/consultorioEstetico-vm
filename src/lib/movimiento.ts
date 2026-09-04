import type { Transition } from "framer-motion";

/**
 * El vocabulario de movimiento del sitio.
 *
 * DE DÓNDE SALE ESTO
 * El usuario dijo que la única pantalla que se siente premium es la de
 * elegir el pago. Al medirlo, esa pantalla es la única que anima con
 * MUELLES; el resto del sitio usa curvas de tiempo. La cuenta era 79
 * transiciones con `duration` frente a 9 `spring`.
 *
 * La diferencia no es de gusto, es de física. Una curva de tiempo dice
 * "tarda 200 ms en llegar": el elemento recorre un guion, y si lo
 * interrumpes a mitad, salta. Un muelle dice "tira de aquí con esta fuerza
 * y este rozamiento": el elemento tiene masa, frena solo, y si lo
 * interrumpes conserva la velocidad que llevaba. Eso es lo que se lee como
 * "caro" — no la duración, sino que el objeto parezca obedecer a algo
 * físico en vez de a un temporizador.
 *
 * CUÁNDO NO USAR MUELLE
 * Cuando el movimiento no representa un objeto: aparecer y desaparecer
 * (opacidad), barras de progreso, y cualquier cosa que deba durar
 * EXACTAMENTE lo mismo que otra. Ahí una curva de tiempo es lo correcto y
 * no hay que cambiarla. Un muelle en una opacidad no aporta nada, porque
 * la opacidad no tiene inercia que simular.
 *
 * Los tres presets cubren lo que hay. Si hace falta un cuarto, probablemente
 * lo que hace falta es reutilizar uno de estos.
 */

/**
 * Respuesta al dedo o al cursor: hover, tap, un botón que se hunde.
 * Rígido y muy amortiguado — tiene que sentirse inmediato y no rebotar,
 * porque un botón que oscila parece roto, no vivo.
 */
export const MUELLE_TACTO: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
};

/**
 * Algo que entra o cambia de sitio: una tarjeta que aparece, un panel que
 * se abre. Más blando y con un punto de rebote, que es lo que hace que
 * parezca que llega y se asienta en vez de aterrizar de golpe.
 */
export const MUELLE_ENTRADA: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
};

/**
 * Movimientos grandes y lentos: una hoja que sube desde abajo, un modal.
 * Blando y muy amortiguado: a este tamaño cualquier rebote se lee como un
 * fallo de la interfaz.
 */
export const MUELLE_LAMINA: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 30,
};

/**
 * Para lo que SÍ debe llevar curva de tiempo: apariciones y desapariciones.
 * Se expone con nombre para que quede claro que es una elección y no un
 * descuido de no haber puesto muelle.
 */
export const CURVA_OPACIDAD: Transition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1],
};
