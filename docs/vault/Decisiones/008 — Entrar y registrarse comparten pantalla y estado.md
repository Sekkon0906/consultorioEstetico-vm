---
tags: [proyecto, decision]
fecha: 2026-09-05
estado: aceptada
---

# 008 — Entrar y registrarse comparten pantalla y estado

## Contexto

Se quería la pantalla de acceso partida en dos —formulario a un lado, motivos al
otro— y que al pasar de entrar a crear cuenta **los lados se intercambiaran**,
con fotos distintas, para que el cambio se notara.

La primera versión mantuvo las dos rutas separadas. Los lados sí se
intercambiaban, pero pasar de una a otra era una **navegación**: React desmonta
el árbol entero y monta el otro, y en un desmontaje no hay nada que animar. El
cruce se veía como un salto.

## Opciones

1. **Dejarlo así.** Los lados cambian, pero sin transición.
2. **Animar entre rutas** con las transiciones de vista del navegador. Soporte
   desigual y difícil de depurar; además no resuelve que el árbol se desmonte.
3. **Fusionar las dos pantallas en un componente con dos estados.**

## Qué elegimos

La opción 3. El asistente de registro sale de su página a un componente propio,
el bloque de entrar también, y una pantalla común los tiene a los dos vivos en el
mismo árbol. Cambiar de modo es un cambio de estado, no de ruta.

**Las dos URLs siguen existiendo.** Cada una renderiza la pantalla común con su
estado inicial, así que enlaces, marcadores y buscadores no se rompen. Al cambiar
de estado se reescribe la barra de direcciones **sin navegar**: no hay remontaje
y no se pierde lo escrito.

**Se reescribe en vez de apilar en el historial.** Alternando tres veces se
dejarían seis entradas, y el botón atrás —que la gente usa para *salir* de una
pantalla, no para deshacer— dejaría a la persona rebotando entre los dos
formularios.

## Por qué el cruce es CSS y no una animación medida

Este es el punto que costó y merece quedar escrito.

Las animaciones de disposición de framer-motion funcionan midiendo: mueven el
elemento a su sitio nuevo, le aplican al instante una transformación que lo
devuelve visualmente al viejo, y animan esa transformación hasta cero.

El problema es **lo que queda si esa animación no llega a correr**: el elemento
se queda en la posición invertida, o sea con los lados sin intercambiar, aunque
el estado sí cambió. Se vio medido, con un desplazamiento residual de exactamente
la distancia del cruce.

Con dos columnas iguales, un desplazamiento del 100 % en CSS da el mismo
resultado visual y su **estado final es el correcto**. Si la transición no corre,
salta al sitio bueno. La posición no depende de ninguna medida, así que tampoco
de que el navegador llegue a hacerla.

Regla general que deja: **preferir animaciones cuyo estado final sea correcto sin
la animación.** Una animación es un adorno; la posición no.

## A qué renunciamos

- Dos archivos más y un movimiento de código que hay que revisar entero, porque
  el asistente de registro tenía el tipo del formulario dentro de la página.
- El intercambio solo se anima al cambiar de estado. Quien llegue escribiendo la
  dirección directamente ve la pantalla ya colocada, sin transición. Es lo
  correcto: nadie espera una animación al abrir una página.
- En móvil no hay dos lados: se apila y el desplazamiento se anula. Los motivos
  van **debajo** del formulario en los dos estados, porque quien abre esta
  pantalla ya sabe a qué viene.

## Cómo saldríamos de aquí

Las dos rutas siguen existiendo y los dos formularios siguen siendo componentes
independientes. Volver a dos páginas separadas es devolver cada componente a su
página y borrar la pantalla común; no hay datos ni esquema de por medio.

## Enlaces

- [[006 — Una cita por procedimiento, sin carrito]]
- Bitácora [[14 — Bitácora 2026-09-05]]
