---
tags: [proyecto, estructura]
actualizado: 2026-09-03
---

# Estructura de carpetas

Volver a [[00 — Consultorio Estético (índice)]]

La regla que ordena todo: **`app/` son solo rutas de Next.js; `src/` es todo
lo demás.** Antes estaban mezcladas y al abrir el proyecto no se distinguía
una página de una pieza reutilizable.

```
app/                        RUTAS (cada carpeta = una URL)
  page.tsx                    /            inicio
  doctora/                    /doctora
  consultorio/                /consultorio
  procedimientos/             /procedimientos  y  /procedimientos/[id]
  testimonios/                /testimonios
  agendar/                    /agendar         flujo de reserva
  login/  register/           acceso y alta
  recuperar/                  recuperación de contraseña
  perfil/                     citas del paciente y edición de datos
  legal/                      privacidad, términos, cookies, aviso
  administrar/                PANEL (solo admin)
    citas/ procedimientos/ testimonios/ charlas/
    horario/ analitica/ configuracion/ copiloto/
  api/                        3 rutas de servidor: correos de cita
  actions/                    server actions (cambio de idioma)
  estilos/                    CSS partido por dominio
  globals.css                 punto de entrada: solo ordena los @import

src/                        TODO LO DEMÁS
  components/                 15 componentes compartidos
    ui/                         Button, ButtonLink — el sistema de botones
  context/                    AuthContext
  lib/                        utilidades
    sesion.ts                   ÚNICO sitio que sabe de dónde sale el token
    apiCliente.ts               capa HTTP compartida
    cache.ts  imagenes.ts  sesion.ts  apiCliente.ts  fechas.ts
  services/                   clientes de la API por dominio
  types/                      tipos del dominio

server/                     BACKEND
  src/
    index.js                  arranque, CORS, límites, rutas
    routes/                   13 módulos, 60 endpoints
    services/                 autenticacion.js
    middlewares/              verifyToken, requireRole, proteccion
    lib/                      db, correo, almacenamiento, roles, jwt
    ia/                       herramientas.js — catálogo del copiloto
  sql/
    schema/                   000_baseline.sql — el esquema completo
    migraciones/              001-004, en orden
    datos/                    contenido del sitio, en SQL
    indexes.sql
  scripts/                    migrar-datos-operativos.sh
  pruebas/                    30 comprobaciones de integración

docs/                       documentación
messages/                   es.json / en.json — 438 claves cada uno
```

## Los estilos

`globals.css` tenía **4.717 líneas**. Ahora son 18 y solo ordena las partes:

| Archivo | Líneas | Qué |
|---|---|---|
| `01-tokens.css` | 136 | Tema claro/oscuro, movimiento, geometría de botones |
| `02-tema-oscuro.css` | 218 | Overrides de modo oscuro por sección |
| `03-compatibilidad.css` | 378 | Red que atrapa estilos en línea con color fijo |
| `04-galeria.css` | 127 | Galería 3D y su panel |
| `05-admin.css` | 49 | Panel |
| `06-responsive.css` | 3.809 | Responsive y el resto |

> [!warning] El orden de los `@import` importa
> Reproduce el que tenían en el archivo original. La cascada de CSS depende
> de él: **reordenarlos cambia qué regla gana sin que salte ningún error.**

## Convenciones

- Imports por alias `@/...` (apunta a `src/`), no relativos. Así mover un
  archivo no rompe a quien lo importa.
- Colores, espaciados y duraciones por **token**, nunca escritos a mano.
- Botones: `Button` si ejecuta una acción, `ButtonLink` si navega. Comparten
  estilos; la diferencia es la semántica del HTML.
