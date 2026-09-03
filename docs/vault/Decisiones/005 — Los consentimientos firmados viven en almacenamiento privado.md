---
tags: [decision, seguridad, almacenamiento]
fecha: 2026-09-03
estado: aceptada
---

# 005 — Los consentimientos firmados viven en almacenamiento privado

Volver a [[00 — Consultorio Estético (índice)]]

## Contexto

El PDF del consentimiento y la imagen de la firma se subían al **mismo
bucket de R2 que las fotos de procedimientos**, que es público: sus objetos
se sirven tal cual desde `r2.dev`, sin autenticación. Y en la base de datos
se guardaba la **URL completa** del archivo.

Eso significaba que cualquiera con esa dirección abría un documento con el
nombre del paciente, su documento de identidad y su firma. No hace falta un
ataque: una URL viaja sola. Va en el correo de confirmación, queda en el
historial del navegador, aparece en los registros de cualquier proxy o
antivirus corporativo por el que pase, y se reenvía sin pensarlo.

Un consentimiento médico no es material de vitrina.

## Opciones

1. **Dejarlo como estaba y confiar en que la URL no se filtre.** Las claves
   llevan marca de tiempo y una parte aleatoria, así que no se pueden
   adivinar por fuerza bruta. Coste cero.
2. **Bucket privado + enlaces temporales firmados.** Los objetos dejan de
   ser accesibles sin credenciales; el backend genera una URL que caduca y
   solo después de comprobar quién pregunta.
3. **Servir el archivo a través del backend**, sin exponer nunca R2. El
   servidor descarga y reenvía el contenido.

## Qué elegimos

La **2**: bucket privado (`R2_BUCKET_PRIVADO`) y enlaces firmados de 10
minutos, generados por `GET /citas/:id/consentimiento` tras comprobar que
quien pide es la doctora o el paciente dueño de la cita.

Y una consecuencia que importa tanto como la anterior: **en la base se
guarda la CLAVE del objeto, no una URL.** Es deliberado — guardar la URL
deja escrita una dirección permanente que funciona para siempre y para
cualquiera; guardar la clave obliga a pasar por el enlace temporal.

## Por qué

La opción 1 confunde *no adivinable* con *privado*. Que una URL sea
imposible de adivinar no impide que se filtre, y aquí el material filtrado
es dato de salud identificable.

La 3 es más estricta —R2 nunca se expone— pero hace pasar cada PDF por el
servidor de Railway: consume su ancho de banda y su memoria, y convierte
una descarga en un punto de fallo del backend. Para un consultorio con
volumen bajo funcionaría, pero no aporta nada sobre la 2: el enlace firmado
ya exige la misma comprobación de permisos, solo que la transferencia la
hace R2, que es lo que sabe hacer.

Diez minutos es corto a propósito: alcanza para abrir o descargar el
documento, y no para que la dirección siga sirviendo si acaba en un
historial o en un reenvío.

## A qué renunciamos

- **Un paso más de infraestructura.** Hay que crear el bucket en Cloudflare
  y definir la variable. Mientras no exista, el código usa el bucket público
  y el servidor lo avisa al arrancar: se prefirió eso a romper el flujo en
  producción, pero es una situación temporal, no el estado deseado.
- **Los enlaces ya no se pueden compartir.** Antes bastaba con pasar la URL;
  ahora hay que entrar con la cuenta. Es exactamente lo que se buscaba.
- **Compatibilidad hacia atrás a medias.** Los consentimientos firmados
  ANTES del 2026-09-03 tienen guardada la URL pública completa. El endpoint
  los devuelve tal cual y los marca como heredados, pero **siguen en el
  bucket público**: migrarlos es un paso pendiente.

## Cómo saldríamos de aquí

Volver atrás es cambiar `subirArchivoPrivado` por `subirArchivo` y guardar
`url` en vez de `clave`. Lo caro no es el código: son las filas ya escritas
con claves en vez de URLs, que habría que reconstruir sabiendo a qué bucket
pertenecen. Por eso esto se decide una vez.

Relacionado: [[003 — Los datos de pacientes nunca van al repositorio]] ·
[[004 — Neon + R2 + Railway + Vercel (fin de Supabase)]]
