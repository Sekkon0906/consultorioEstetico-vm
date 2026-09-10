# Lo que falta

Estado a 10 de septiembre de 2026. Comprobado contra la base de producción y
contra el código, no de memoria. (El estado de la base es del día 5; lo demás,
del 10.)

**Casi nada de lo que queda es programar.** Lo que impide que el consultorio
funcione hoy son cuatro variables de entorno y una prueba en un iPhone.

---

## 🔴 Bloquea que la web sirva

### 1. Encender los correos — es lo que más resultado da por menos trabajo

Los **siete correos ya están escritos y conectados**, verificado función por
función: verificar cuenta, recuperar contraseña, nueva cita a la doctora, cita
confirmada al paciente, reagenda, recordatorio del día anterior y el cron que
lo dispara.

**No llega nada por configuración, no por código.** Faltan estas variables en
Railway:

| Variable | Para qué |
|---|---|
| `RESEND_API_KEY` | La clave. **Genera una nueva**, ver el aviso de seguridad abajo. |
| `NOTIFY_DOCTOR_EMAIL` | A dónde llega el aviso de cita nueva. |
| `CORREO_DESDE` | El remitente. Tiene que ser de un dominio verificado en Resend. |
| `CRON_SECRET` | **El mismo valor en Vercel y en Railway**, o el cron devuelve 401 y los recordatorios no salen. |
| `API_URL` | En Vercel, apuntando al backend. |

**La cuenta de Resend ya tiene un dominio verificado**
(`caballoscolombianosymas.com`, de otro proyecto). Eso quita el bloqueo del
dominio: se puede enviar a cualquier destinatario hoy mismo.

> **Pero no lo uses para escribir a las pacientes.** Recibir «confirmación de
> tu cita» desde un dominio de caballos parece spam. Para el aviso a la
> doctora vale; los de pacientes deberían esperar al dominio del consultorio.

**Cómo comprobar que quedó bien:** agenda una cita de prueba y mira si llega el
correo. Si no llega, el registro del servidor dice el motivo.

### 2. Probar el botón de WhatsApp en un iPhone real

Ya confirmaste que **no envía desde el móvil**. La causa es que `window.open`
se llama después de esperar la respuesta del servidor, y Safari lo bloquea
porque el gesto del usuario ya se consumió.

**Está arreglado** —el botón se movió dentro del recibo, donde pulsarlo es un
gesto directo— pero hasta que se despliegue, en producción sigue roto. Cuando
se despliegue, confirma que ya abre.

---

## 🟠 Hay que hacerlo en un orden concreto

### 3. Ejecutar la migración 010, DESPUÉS de desplegar

`server/sql/migraciones/010_quitar_pago_online.sql` **está escrita y sin
aplicar a propósito**. Borra la columna `citas.tipo_pago_online`, que todavía
existe en producción (comprobado).

> El servidor que hay hoy desplegado **todavía nombra esa columna** en su
> SELECT y su INSERT. Borrarla antes de desplegar el código nuevo **rompe
> agendar al instante**.

Orden correcto:

1. Mergear y desplegar.
2. Comprobar que se puede agendar una cita en producción.
3. Ejecutar la migración.

Si se queda sin ejecutar no pasa nada: una columna que nadie lee puede esperar
indefinidamente. Lo que no se puede es adelantarla.

**La regla, en las dos direcciones:** el paso que **añade** va antes, el que
**quita** va después. La migración 008 rompió el registro por hacerlo al revés.

---

## 🟡 Configuración opcional

### 4. El conector MCP (Claude de la doctora)

Ya funciona, verificado de punta a punta. Para producción, en Railway:

```
APP_URL=<url del sitio>
API_URL=<url de la API>
```

`MCP_TOKEN` **deja de ser obligatorio**: se conserva solo como atajo para
Claude Desktop. En producción lo correcto es entrar por OAuth.

Después, desde la app de Claude: añadir el consultorio como conector y
autorizar con la cuenta de la doctora. Solo un administrador puede autorizar.

### 5. El copiloto del panel (opcional, y cuesta dinero)

Está completo y le falta solo la clave. **Es un lujo, no una necesidad** — el
aviso de las citas lo resuelve el correo, que es gratis.

Si se quiere:

```
ANTHROPIC_API_KEY=sk-ant-...
```

o que la doctora pegue la suya desde **Administrar → Asistente**
(`SECRETS_ENCRYPTION_KEY` ya está puesta, así que ese camino funciona).

Para comprobar la clave sin pasar por la interfaz:

```bash
node server/scripts/probar-copiloto.js
```

Dice de dónde sale la clave, hace una llamada real y traduce el error. Nunca
imprime la clave.

---

## 🔵 Trabajo de la doctora, no de código

### 6. Cargar el contenido de verdad

Textos, precios, fotos y descripciones. Todo se edita desde el panel sin tocar
código. **Esto es lo que más va a mejorar el sitio ahora mismo**, y va a
destapar cosas que ninguna auditoría técnica encuentra.

### 7. Validar los textos médicos del consultorio

`src/components/ConsultorioDetalle.tsx` afirma cosas concretas —registro
INVIMA, control de ciclos de autoclave, horarios— que **nadie ha validado**.
Son afirmaciones sobre una práctica médica: tienen que ser ciertas.

### 8. Tres decisiones de la tarjeta de fidelidad

Los dos números (cada cuántos, qué porcentaje) ya se editan desde
**Administrar → Información general**. Lo que queda por decidir es de negocio:

- ¿Caduca el beneficio? Ahora no.
- ¿Se reinicia al usarlo? El sitio cuenta procedimientos; el canje lo lleva
  ella.

La tarjeta **informa, no aplica**: no descuenta nada al agendar. Es
deliberado — el precio final depende de la valoración.

---

## ⚫ Descartado

- **Pasarela de pago.** Se evaluó Wompi como la más razonable; se decidió no
  implementarla. Su andamiaje ya se retiró del código (ver punto 3).

---

## ⚠️ Aviso de seguridad

**La clave de Resend que está en uso pasó por una conversación de chat.**
Funciona, pero está expuesta. Genera una nueva en Resend, revoca la vieja y
pon la nueva directamente en Railway.

Regla general: una clave que pasa por un chat, un correo o una captura está
quemada aunque siga funcionando. Rotarla cuesta un minuto.

**Y `server/.env` apunta a la base de PRODUCCIÓN.** Cualquier prueba local
escribe en la base real. Conviene saberlo antes de probar formularios.

---

## Estado medido de la base (5 sep 2026)

| | |
|---|---|
| Usuarios | 1 |
| Citas | 3 |
| Administradores | 1 |
| Clientes MCP registrados | 0 |
| `citas.tipo_pago_online` | todavía existe (migración 010 sin aplicar) |

---

## Cola larga, sin urgencia

**Estado del lint: 33 errores** (eran 308 el 5 de septiembre).

- **31 `no-explicit-any`.** Es la deuda que queda, y es real: tipos sin
  concretar, sobre todo en manejadores de error (`catch (e: any)`). Arreglarlo
  bien exige mirar qué devuelve cada API en cada caso, así que no se puede
  hacer en bloque.
- **~180 colores escritos a mano**, repartidos en 33 archivos. La regla de
  lint impide añadir más; los existentes están en una lista de excepciones que
  se vacía archivo a archivo. Ocho salieron el 10 de septiembre.
  - **Dos no van a salir nunca, y está bien:** los `theme-color` de
    `app/layout.tsx` tienen que ser literales porque el navegador los lee
    fuera del documento, donde `var()` no resuelve.
  - **Ojo:** la regla lee el *texto crudo* del archivo y no distingue
    comentarios. Citar un color viejo dentro de un comentario la dispara.
- **51 campos de formulario del panel sin etiqueta asociada.** Deliberadamente
  despriorizado: hay una sola usuaria y conoce el panel.
- **F14b:** auditoría de colores en un navegador real, con los dos temas. Es
  lo único que puede confirmar que las sustituciones a tokens se ven bien en
  oscuro; hasta ahora se comprobó que resuelven al mismo valor en claro.
