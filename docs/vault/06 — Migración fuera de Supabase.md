---
tags: [proyecto, migracion]
actualizado: 2026-09-01
---

# Migración fuera de Supabase

Volver a [[00 — Consultorio Estético (índice)]]

**Objetivo:** que la plataforma no dependa de Supabase ni de cuentas
personales. Que sea un proyecto independiente.

## Qué reemplaza a qué

| Hoy lo hace Supabase | Lo reemplaza | Estado |
|---|---|---|
| Base de datos | Neon o Postgres de Railway | Esquema y contenido **ya versionados** |
| Inicio de sesión | Auth propia (`/auth2`) + Google OAuth | **Código listo**, falta activar |
| Correos | Resend | **Código listo**, falta dominio |
| Imágenes y archivos | Cloudflare R2 | **Código listo**, falta configurar |

## Lo que falta y de qué depende

### Solo necesita el dominio (minutos cada uno)
1. Verificar el dominio en Resend con SPF, DKIM y DMARC. *Es lo que más tarda
   por propagación de DNS — conviene empezar por ahí.*
2. Registrar `<API_URL>/auth2/google/callback` en Google Cloud Console.
3. Restringir la clave de Google Maps por referente.
4. Subdominio para el bucket R2 (opcional; sirve la URL de `r2.dev`).

### No necesita el dominio
1. **Migrar los ~30 archivos del frontend que aún usan Supabase.** El grueso
   del trabajo.
2. Crear la base en Neon/Railway y correr los SQL.
3. Copiar los archivos de Storage a R2 y actualizar las URLs guardadas.
4. Sacar los videos de la cuenta personal de YouTube.
5. Favicon adaptado a modo oscuro *(bloqueado: hace falta el archivo del logo,
   que vive en Supabase y no es descargable desde el entorno de desarrollo)*.

## Los archivos que aún atan a Supabase

| Tipo | Cuántos | Dificultad |
|---|---|---|
| Solo autenticación | ~8 | Mecánica: cambiar a `sesion.ts` |
| Datos o archivos | ~15 | Necesitan endpoint con los mismos campos |

**Ya migrados:** `procedimientosApi`, `testimoniosApi`, `notifyApi` — libres
de Supabase por completo.

> [!tip] El patrón para migrar un servicio
> 1. Comprobar que el endpoint de la API devuelve **todos** los campos que el
>    frontend lee. `procedimientos` devolvía 8 de 15, y por eso el frontend lo
>    esquivaba.
> 2. Reescribir el servicio usando `apiFetch`/`apiAuth`.
> 3. Typecheck y build.

## El día del corte

```bash
# 1. Crear la base nueva y levantar el esquema (ver 03 — Base de datos)

# 2. Migrar los datos de pacientes, base a base — nunca por Git
export ORIGEN='postgres://...'   # Supabase
export DESTINO='postgres://...'  # la nueva
./server/scripts/migrar-datos-operativos.sh

# 3. Apuntar DATABASE_URL del backend a la base nueva
# 4. Dejar Supabase en SOLO LECTURA unas semanas antes de darlo de baja
```

El script verifica que los conteos coincidan en ambas bases antes de dar por
buena la migración, e importa en una transacción: o entra todo, o nada.

## Decisiones tomadas

- **Postgres en cualquier proveedor**, no una base propietaria. Postgres sigue
  siendo Postgres: eso elimina el riesgo de reescritura.
- **El backend nunca usa el SDK de Supabase para datos**, solo SQL directo.
  Es lo que hace que migrar sea cambiar una variable.
- **Los dos sistemas de login conviven** en vez de cortar de golpe. Cortar el
  acceso de la doctora al panel en un despliegue es como se pierde un lunes.
- **Los datos de pacientes nunca van al repositorio.** Hoy es teórico (las
  citas que había eran todas de prueba), pero el patrón queda montado antes
  de que haya pacientes reales.
