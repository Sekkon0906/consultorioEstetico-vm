---
tags: [proyecto, decision]
fecha: 2026-09-05
estado: aceptada
---

# 007 — El permiso comercial vive aparte de los correos del servicio

## Contexto

Se quiere mandar promociones y montar una tarjeta de fidelidad que dé descuento
al séptimo procedimiento. Antes de eso hay un obstáculo que no es técnico.

La Ley 1581 de 2012 (habeas data) exige consentimiento **previo, expreso e
informado** para tratar datos personales con fines comerciales. «Previo»
significa antes del primer correo; «expreso» significa que el silencio no vale,
así que una casilla premarcada no sirve; e «informado» significa decir para qué.

En la base no existía ningún sitio donde guardar ese permiso.

## Opciones

1. **Mandar promociones a todos los registrados.** Es lo que hace mucha gente y
   es ilegal aquí: registrarse para pedir una cita no es aceptar publicidad.
2. **Una sola casilla que cubra política de datos y promociones.** También
   incumple: el consentimiento comercial tiene que poder negarse por separado.
3. **Una columna aparte, con casilla propia y voluntaria.**

## Qué elegimos

La opción 3, con dos matices que resultaron ser lo importante.

**Hay dos clases de correo y no se pueden mezclar.** Los que el servicio
necesita para funcionar —cita confirmada, recordatorio, reagenda, recuperar
contraseña— no piden permiso aparte: los pidió quien pidió una cita, y sin ellos
la cita no funciona. Solo los comerciales dependen de esta columna.

**Se guarda cuándo y desde dónde se aceptó**, no solo un sí o un no. Ante una
queja, lo que hay que poder demostrar no es que la casilla esté marcada hoy: es
que la persona la marcó, y cuándo. Al darse de baja el booleano pasa a falso
pero esas dos columnas **se conservan**, porque son la prueba de que los envíos
anteriores fueron legítimos.

**La baja no exige iniciar sesión**, y va firmada con HMAC en vez de un token
guardado. Quien está harto de recibir correos no va a buscar su contraseña para
dejar de recibirlos, así que exigir sesión ahí equivale a no ofrecer la baja.

## Por qué

- Un token de un solo uso por destinatario y envío serían 500 inserciones para
  un correo a 500 personas, se gastaría al primer clic —y los clientes de correo
  precargan enlaces— y caducaría. La firma no ocupa nada y vale siempre. El
  derecho a darse de baja no caduca.
- El valor por defecto es **falso**. No es una preferencia de producto: quien ya
  estaba registrado nunca dio este permiso, y poner verdadero convertiría la base
  entera en una lista de correo sin consentimiento.
- El pie de baja se **pasa como argumento** en cada envío comercial en vez de
  salir solo. Si algún día alguien lo olvida, el fallo es que un correo comercial
  no lleva baja —visible y corregible—, y no que un correo de servicio la lleva
  de más, que es silencioso y sugiere que se puede dejar de recibir el aviso de
  una cita médica.

## A qué renunciamos

- No se puede escribir a quien ya está registrado hasta que acepte. La lista
  arranca vacía.
- Un endpoint más y una casilla más en el registro.
- El filtro exige además correo verificado: una dirección sin verificar puede ser
  de otra persona que se tecleó mal, y mandarle publicidad a un tercero que nunca
  pidió nada es justo lo que la ley prohíbe. Eso reduce la lista.

## Cómo saldríamos de aquí

La columna es aditiva y no rompe nada si se ignora. Revertir el código es
trivial; lo que **no** se puede revertir es haber enviado sin permiso, así que el
riesgo va en una sola dirección.

Si algún día se cambia de proveedor de correo, esta decisión no se toca: gobierna
a quién se puede escribir, no con qué herramienta.

## Enlaces

- [[003 — Los datos de pacientes nunca van al repositorio]]
- Bitácora [[14 — Bitácora 2026-09-05]]
