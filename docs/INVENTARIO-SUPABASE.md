# Inventario real de Supabase — `ConsultorioVM_DB`

Proyecto `ibpkihfjripvizismhsk` · Postgres 17 · us-east-1.
Levantado directamente del proyecto, no reconstruido del código.

## Conclusión principal

**La base está en estado de pruebas, no en producción con pacientes reales.**

| Métrica | Valor |
|---|---|
| Cuentas en `auth.users` | **1** |
| Cuentas con contraseña | **0** (la única entró por Google) |
| Administradores (`admin_users`) | 1 |
| Citas | 22, **todas del mismo usuario**, entre 2026-03-27 y 2026-06-11 (ninguna futura) |
| Citas con PDF de consentimiento real | **0** (`consentimiento_pdf` guarda `''`, no una URL) |
| Procedimientos / testimonios / charlas | 15 / 3 / 2 |
| Archivos en Storage | 65 archivos, **~40 MB** en 5 buckets |

Esto simplifica mucho la migración:

- **No hay contraseñas que migrar.** La fase 03 no necesita compatibilidad bcrypt.
- **No hay citas futuras ni pacientes reales.** El corte no requiere ventana sin caída.
- **40 MB de archivos.** Caben de sobra en el VPS; no hace falta CDN para imágenes.

## Tablas (16)

RLS **activo en las 16**. Cuatro tablas no aparecían en el estudio inicial porque
el código no las usa todavía: `admin_users`, `horario_global`,
`horarios_por_fecha`, `procedimiento_media`.

`admin_users(uid, added_at, note)` · `bloqueos_globales` · `bloqueos_horas` ·
`charlas` · `charla_galeria` · `citas` · `comentarios_pacientes` ·
`horario_global` · `horarios_por_fecha` · `procedimientos` ·
`procedimiento_galeria` · `procedimiento_media` · `reagendas` ·
`reportes_mensuales` · `testimonios` · `usuarios`

### Detalles que afectan la migración

- **`usuarios` NO tiene columna `email`.** El correo vive solo en `auth.users`.
  Al migrar hay que añadir `email`, `password_hash`, `proveedor` y
  `email_verificado` a `usuarios`, conservando los UUID.
- `citas` tiene 34 columnas, incluidas `firma_documento`, `firma_direccion` y
  `firma_uso_promocional`, que el código todavía no usa.
- `citas.qr_url` en la base, pero el frontend lo mapea como `qr_cita`.
- `procedimientos` **ya tiene** `en_promocion`, `precio_promocional` y
  `promocion_hasta`. Las promociones del copiloto no requieren tabla nueva.
- `procedimientos.precio` es `text`, no numérico.

## Seguridad — corrección al estudio inicial

Con las políticas a la vista, **dos de los tres hallazgos "críticos" quedan
mitigados por RLS**. Los dejo corregidos aquí:

| Hallazgo inicial | Estado real |
|---|---|
| Fuga de la agenda con datos del paciente | **Mitigado.** `cit_sel` es `user_id = auth.uid() OR is_admin()`. Un usuario no ve citas ajenas. |
| Rol de admin decidido en el cliente | **Mitigado.** `is_admin()` es `SECURITY DEFINER` y lee `admin_users`, tabla sin políticas de escritura. El `rol` de `usuarios` solo afecta qué UI se muestra, no qué datos se devuelven. |
| Firmas y consentimientos en bucket público | **Confirmado.** `ConsultorioImagenes` es `public=true` y contiene `firmas/`. Hoy hay 1 archivo, así que el alcance es mínimo, pero el diseño debe corregirse antes de que se acumulen. |

### Lo que sí queda pendiente de arreglar

1. **`firmas/` y `consentimientos/` en bucket público** — los 5 buckets son
   públicos. Deben separarse en público y privado con URL firmada.
2. **`usr_upd` sin `WITH CHECK` sobre columnas** — un usuario puede ponerse
   `rol = 'admin'` en su propia fila. No escala privilegios (la autoridad es
   `admin_users`), pero le abre la interfaz de administración, que es confuso
   y no debería ser posible.
3. **Lista de correos de admin dentro de la política `usr_sel`** — repite
   `medinapipe123@gmail.com` y `admin@clinicavm.com` en SQL. Debería usar
   `is_admin()` como el resto.
