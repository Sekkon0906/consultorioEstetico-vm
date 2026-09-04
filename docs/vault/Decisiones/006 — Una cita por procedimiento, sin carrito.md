---
tags: [proyecto, decision]
fecha: 2026-09-03
estado: revisada
revisada: 2026-09-04
---

# 006 — Una cita por procedimiento, sin carrito

Volver a [[00 — Consultorio Estético (índice)]]

> [!warning] Revisada el 2026-09-04
> El usuario pidió implementar el carrito de todas formas, después de leer
> esta recomendación. **Se implementó.** Lo que sobrevive de la decisión es
> el análisis del dominio, y ese análisis dio forma a cómo se construyó: ver
> "Qué se acabó haciendo" al final.

## Contexto

Se planteó añadir un carrito de la compra para que un paciente pudiera agendar
varios procedimientos de una vez: un botón "+" en cada tarjeta, un círculo que
sube hasta el icono del carrito, el carrito tiembla y el contador pasa de 0 a 1.

Antes de decidir se preguntaron las dos cosas que importaban, y las respuestas
fueron:

- Los procedimientos de una misma reserva **pueden ser en días distintos**.
- La doctora **los confirma por separado**, uno a uno.

## Opciones

1. **Carrito completo.** Una reserva agrupa N procedimientos. Requiere una tabla
   `reservas` por encima de `citas`, estados por línea, y decidir qué significa
   confirmar "la reserva" cuando sus líneas van por separado.
2. **Nada.** Se agenda de uno en uno y el paciente repite el flujo entero.
3. **Encadenar.** Tras confirmar, un botón "Agendar otro procedimiento" que
   vuelve al paso 1 con los datos ya puestos, y "Mis citas" agrupadas por
   cercanía de fecha.

## Qué elegimos

La **3**.

## Por qué

Un carrito promete un "finalizar compra": un momento único en el que todo lo
que metiste se paga y se entrega junto. Aquí no existe ese momento. Los días son
distintos y las confirmaciones son separadas, así que el carrito enseñaría un
botón que no cumple lo que su forma promete, y el paciente esperaría una
confirmación única que nunca va a llegar.

La fricción que un carrito quitaría —volver a escribir tus datos en cada
reserva— **ya no existe**: el paciente está identificado antes de agendar (F13).
El único coste que queda de repetir el flujo es volver a elegir día y hora, y eso
hay que hacerlo igual en un carrito, porque cada procedimiento tiene el suyo.

## A qué renunciamos

- A ver "3 procedimientos" en un mismo sitio antes de confirmar nada.
- A la animación del círculo que sube al carrito, que era la parte que más
  ilusión hacía. Parte de ese gusto por el movimiento se puede recuperar
  llevando muelles a los elementos interactivos: hoy hay **79 tweens con
  `duration` frente a 9 `spring`** en todo el sitio, y la pantalla de pago —la
  única que usa muelles— es justo la que se percibe como premium.

## Cómo saldríamos de aquí

Sin migración destructiva. `citas` sigue siendo la unidad y no cambia. Si algún
día la doctora empieza a confirmar paquetes juntos, se añade una tabla
`reservas` con `id` y `creado_en`, y a `citas` una columna `reserva_id` que
puede ser nula: las citas de hoy se quedan como están, con `reserva_id` a nulo,
y las nuevas se agrupan. La decisión es reversible precisamente porque no
agrupamos ahora.

---

## Qué se acabó haciendo (2026-09-04)

Se construyó, pero doblado por lo que dice el análisis de arriba en vez de
copiar un carrito de comercio electrónico:

- **Se llama "Mi selección", no "carrito"**, y el icono es un portapapeles y
  no un carro de supermercado. El icono es la promesa: un carro anuncia que
  al final hay una caja donde se paga todo junto, y esa caja no existe.
- **No hay botón de "confirmar todo".** Cada línea lleva su propio
  "Agendar", que entra al flujo de siempre con el nombre en la URL. El flujo
  de agenda no cambió ni una línea.
- **Sí hay total**, marcado como orientativo, porque saber cuánto suma es la
  razón principal por la que alguien junta cosas en una lista.
- **Vive en `localStorage`**, no en el servidor: la selección se hace antes
  de identificarse, y guardarla en el servidor obligaría a pedir cuenta para
  mirar precios.

Y la animación que el usuario quería: el círculo que sube desde el `+`,
describe un arco y cae en la insignia, que tiembla y sube el contador.

Archivos: `src/context/CarritoContext.tsx`,
`src/components/VueloAlCarrito.tsx`,
`src/components/BotonAñadirSeleccion.tsx`,
`src/components/InsigniaSeleccion.tsx`, `app/seleccion/page.tsx`.

La salida sigue siendo la de arriba: `citas` no cambió, así que si algún día
la doctora confirma paquetes juntos, se añade `reservas` y un `reserva_id`
que puede ser nulo.
