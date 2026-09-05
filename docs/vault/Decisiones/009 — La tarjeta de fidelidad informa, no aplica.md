---
tags: [proyecto, decision]
fecha: 2026-09-05
estado: aceptada
---

# 009 — La tarjeta de fidelidad informa, no aplica

## Contexto

Se quería premiar a quien repite: al séptimo procedimiento, un 20 % de
descuento, con la doctora pudiendo ajustar tanto el número como el porcentaje.

Tres preguntas quedaron abiertas y ninguna es técnica: qué cuenta, si se
reinicia al usarlo, y si caduca.

## Opciones

1. **Aplicar el descuento automáticamente** en el flujo de agendar.
2. **Solo contar y mostrar el avance**, dejando la aplicación en consulta.
3. Un sistema de puntos y canjes con su propia contabilidad.

## Qué elegimos

La opción 2, y los dos números viven en `configuracion_sitio`.

## Por qué no se aplica el descuento solo

Dos razones, y cualquiera de las dos basta:

- **El precio final depende de la valoración.** Lo dice la propia web. Un
  descuento automático prometería un importe cerrado que la consulta puede no
  confirmar, y el sitio quedaría desmintiéndose a sí mismo.
- **El sitio no sabe si ya se dio.** El descuento lo aplica la doctora en
  consulta. Sin registrar el canje —que es la opción 3, mucho más cara—, el
  contador no puede saber si el beneficio de la vuelta anterior se usó.

La tarjeta dice «llevas 5 de 7» y lo deja escrito en el propio componente: *el
descuento lo aplica la doctora en el consultorio*. Sin esa frase, alguien
llega esperando que ya esté puesto.

## Qué cuenta, y por qué así

Solo citas con estado `atendida` y fecha ya pasada. Ni agendadas ni
canceladas: si contaran las agendadas, cualquiera reserva siete y pide el
beneficio.

Es **la misma regla que ya usa el historial de procedimientos**, reutilizada a
propósito. Dos contadores del mismo hecho que no coincidieran serían un
problema peor que no tener el segundo: la persona vería dos números distintos
en la misma pantalla y no sabría a cuál creer.

## Lo que se dejó fuera, y por qué

- **La caducidad.** «Siete en un año» y «siete en cinco» no son lo mismo, pero
  ponerle fecha límite a un beneficio sin que nadie lo haya pedido convierte
  una recompensa en una cuenta atrás. Si hace falta se añade; quitarla después
  de anunciarla es mucho peor.
- **El reinicio al canjear.** No lo puede decidir el código, porque el canje
  ocurre fuera del sitio. Es de la doctora, no del sistema.

## Por qué los números van en la configuración

«Al séptimo, un 20 %» no es una regla técnica: es una decisión comercial que
va a moverse según funcione. En el código, cambiar el 7 por un 5 es tocar un
archivo y desplegar. En `configuracion_sitio` es un formulario que la doctora
ya sabe usar, y como el panel de configuración es genérico —pinta lo que haya
en la tabla— no hizo falta ni pantalla nueva.

Con `fidelidad_cada` a `0` la tarjeta desaparece entera, sin desplegar nada.

## A qué renunciamos

- No hay automatismo: si la doctora olvida aplicarlo, no se aplica. Se mitiga
  con el aviso de la propia tarjeta al completarse («recuérdaselo en tu
  próxima cita»), pero el olvido sigue siendo posible.
- No hay registro de canjes, así que tampoco hay forma de saber cuántos
  beneficios se han dado.

## Cómo saldríamos de aquí

Pasar a la opción 3 —canjes registrados— es aditivo: haría falta una tabla de
canjes y un botón en el panel. Nada de lo hecho ahora estorba, porque el
contador seguiría siendo el mismo.

## Enlaces

- [[007 — El permiso comercial vive aparte de los correos del servicio]]
- Bitácora [[14 — Bitácora 2026-09-05]]
