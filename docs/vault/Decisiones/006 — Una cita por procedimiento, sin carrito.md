---
tags: [proyecto, decision]
fecha: 2026-09-03
estado: aceptada
---

# 006 — Una cita por procedimiento, sin carrito

Volver a [[00 — Consultorio Estético (índice)]]

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
