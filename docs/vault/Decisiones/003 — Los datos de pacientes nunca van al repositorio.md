---
tipo: decision
proyecto: consultorioEstetico-vm
fecha: 2026-09-01
estado: vigente
---

# 003 — Los datos de pacientes nunca van al repositorio

Volver a [[00 — Consultorio Estético (índice)]]

## Contexto

Para independizar la base de Supabase hay que volcar esquema y contenido al
repo. Las citas guardan nombre, teléfono, correo, procedimiento y
consentimiento firmado — información sujeta a la Ley 1581 de 2012 (habeas data)
y al secreto profesional.

## Opciones

- Volcar todo (esquema + contenido + datos operativos) al repo para tener un
  seed completo.
- Volcar solo esquema y contenido del sitio; migrar los datos de pacientes
  base a base el día del corte.

## Qué elegimos

Al repo van `000_baseline.sql` (esquema), las migraciones y
`datos/010_contenido.sql` (contenido del sitio). Los datos de pacientes se
migran con `server/scripts/migrar-datos-operativos.sh`, directo de base a base,
en una transacción y con verificación de conteos.

## Por qué

Un repositorio se clona, se comparte y queda en el historial para siempre,
aunque se borre el archivo después. Levantar una base de desarrollo con cero
datos de pacientes es lo que se quiere.

## A qué renunciamos

A un seed realista para pruebas. Se compensa con las 29 pruebas de integración
que crean sus propios datos.

## Cómo saldríamos de aquí

No hay vuelta atrás deseable. Si alguna vez se necesita un dump con datos
reales, se hace fuera de Git y cifrado.

## Nota

Al tomar la decisión era teórico: las 23 citas en la base eran todas de la
cuenta de prueba. El patrón queda montado antes de que haya pacientes reales.
