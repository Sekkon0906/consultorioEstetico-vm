/**
 * Herramientas del copiloto.
 *
 * Reglas de diseño, en orden de importancia:
 *
 *  1. El modelo NUNCA genera SQL. Cada herramienta es una función acotada que
 *     hace exactamente una operación con parámetros validados.
 *  2. El modelo NUNCA obtiene permisos que un humano no tenga: estas funciones
 *     se ejecutan detrás del mismo verifyToken + requireRole(["admin"]) que el
 *     formulario equivalente del panel.
 *  3. El modelo solo ve datos de pacientes que la doctora ya puede ver en el
 *     panel de citas (nombre, hora, procedimiento del día) a través de
 *     `citas_del_dia`. No hay ninguna herramienta que lea `usuarios` ni datos
 *     de contacto (teléfono, correo). Las consultas de negocio históricas
 *     (`resumen_de_citas`) siguen devolviendo solo agregados.
 *  4. Lo que escribe se confirma antes. `escribe: true` marca las herramientas
 *     cuya ejecución exige aprobación explícita de la doctora.
 */

const { pool } = require("../lib/db");

// ── Catálogos permitidos ─────────────────────────────────────────────────────
const CATEGORIAS = ["Facial", "Corporal", "Capilar", "Antienvejecimiento", "Otros"];

// ── Definiciones que ve el modelo ────────────────────────────────────────────
// `strict: true` + additionalProperties:false garantiza que los argumentos
// lleguen validados y no haya que adivinar campos.
const DEFINICIONES = [
  {
    name: "listar_procedimientos",
    description:
      "Lista los procedimientos del consultorio con su precio, categoría y si están en promoción. " +
      "Úsala antes de actualizar uno, para obtener su id exacto.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description: "Filtra por categoría. Omite para traer todos.",
          enum: CATEGORIAS,
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "crear_procedimiento",
    description:
      "Crea un procedimiento nuevo. Si la doctora no menciona algún dato, pregúntaselo " +
      "en vez de inventarlo: es un consultorio médico y un precio o una duración " +
      "equivocada tiene consecuencias reales.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        nombre:      { type: "string", description: "Nombre del procedimiento." },
        descripcion: { type: "string", description: "Descripción breve para el listado." },
        precio:      { type: "string", description: "Precio como texto, por ejemplo '850.000'." },
        categoria:   { type: "string", enum: CATEGORIAS },
        duracion_min:{ type: "integer", description: "Duración en minutos." },
      },
      required: ["nombre", "descripcion", "precio", "categoria", "duracion_min"],
      additionalProperties: false,
    },
  },
  {
    name: "actualizar_procedimiento",
    description:
      "Modifica campos de un procedimiento existente. Solo cambia los campos que se indiquen. " +
      "Obtén el id con listar_procedimientos.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        id:          { type: "string", description: "UUID del procedimiento." },
        nombre:      { type: "string" },
        descripcion: { type: "string" },
        precio:      { type: "string" },
        categoria:   { type: "string", enum: CATEGORIAS },
        duracion_min:{ type: "integer" },
        destacado:   { type: "boolean", description: "Si aparece resaltado en el sitio." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "configurar_promocion",
    description:
      "Activa o desactiva una promoción sobre un procedimiento existente. Para activarla " +
      "hacen falta el precio promocional y la fecha hasta la que aplica.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        id:                 { type: "string", description: "UUID del procedimiento." },
        en_promocion:       { type: "boolean", description: "true activa, false desactiva." },
        precio_promocional: { type: "string", description: "Precio con descuento. Obligatorio si en_promocion es true." },
        promocion_hasta:    { type: "string", description: "Fecha final en formato AAAA-MM-DD. Obligatoria si en_promocion es true." },
      },
      required: ["id", "en_promocion"],
      additionalProperties: false,
    },
  },
  {
    name: "leer_configuracion",
    description:
      "Lee la información general del consultorio: dirección, teléfonos, horario, datos legales. " +
      "Úsala antes de actualizar_configuracion para saber las claves y los valores actuales.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        grupo: {
          type: "string",
          description: "Filtra por grupo. Omite para traer todo.",
          enum: ["contacto", "ubicacion", "horario", "legal", "marca"],
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "actualizar_configuracion",
    description:
      "Cambia uno o más datos generales del consultorio. Solo acepta claves que ya existen: " +
      "consúltalas primero con leer_configuracion.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        cambios: {
          type: "array",
          description: "Lista de cambios a aplicar.",
          items: {
            type: "object",
            properties: {
              clave: { type: "string", description: "Clave exacta, por ejemplo 'contacto_whatsapp'." },
              valor: { type: "string", description: "Valor nuevo." },
            },
            required: ["clave", "valor"],
            additionalProperties: false,
          },
        },
      },
      required: ["cambios"],
      additionalProperties: false,
    },
  },
  {
    name: "resumen_de_citas",
    description:
      "Devuelve CONTEOS AGREGADOS de citas en un rango de fechas: cuántas hubo, por estado y " +
      "por procedimiento. No devuelve nombres, teléfonos ni ningún dato que identifique a un " +
      "paciente, y no existe ninguna herramienta que lo haga.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        desde: { type: "string", description: "Fecha inicial AAAA-MM-DD." },
        hasta: { type: "string", description: "Fecha final AAAA-MM-DD." },
      },
      required: ["desde", "hasta"],
      additionalProperties: false,
    },
  },
  {
    name: "citas_del_dia",
    description:
      "Lista las citas de una fecha con nombre del paciente, hora, procedimiento y estado. " +
      "Úsala cuando la doctora pregunte 'qué citas tengo hoy', 'cuántas citas hay mañana', etc.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        fecha: { type: "string", description: "Fecha AAAA-MM-DD. Si la doctora dice 'hoy' o 'mañana', calcula la fecha exacta." },
      },
      required: ["fecha"],
      additionalProperties: false,
    },
  },
];

// Herramientas que modifican datos: exigen confirmación de la doctora.
const ESCRIBEN = new Set([
  "crear_procedimiento",
  "actualizar_procedimiento",
  "configurar_promocion",
  "actualizar_configuracion",
]);

const escribe = (nombre) => ESCRIBEN.has(nombre);

// ── Validaciones que el esquema no puede expresar ────────────────────────────
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validar(nombre, args) {
  if (nombre === "configurar_promocion" && args.en_promocion) {
    if (!args.precio_promocional) return "Para activar una promoción hace falta el precio promocional.";
    if (!RE_FECHA.test(args.promocion_hasta || "")) return "La fecha de la promoción debe tener formato AAAA-MM-DD.";
  }
  if (nombre === "resumen_de_citas") {
    if (!RE_FECHA.test(args.desde) || !RE_FECHA.test(args.hasta)) return "Las fechas deben tener formato AAAA-MM-DD.";
    if (args.desde > args.hasta) return "La fecha inicial no puede ser posterior a la final.";
  }
  if (nombre === "citas_del_dia" && !RE_FECHA.test(args.fecha || "")) {
    return "La fecha debe tener formato AAAA-MM-DD.";
  }
  if (nombre === "crear_procedimiento" && (args.duracion_min < 5 || args.duracion_min > 480)) {
    return "La duración debe estar entre 5 y 480 minutos.";
  }
  if (nombre === "actualizar_configuracion") {
    if (!Array.isArray(args.cambios) || !args.cambios.length) return "No se indicó ningún cambio.";
    if (args.cambios.length > 30) return "Demasiados cambios en una sola operación.";
  }
  return null;
}

// ── Ejecutores ───────────────────────────────────────────────────────────────
const EJECUTORES = {
  async listar_procedimientos(args) {
    const { rows } = args.categoria
      ? await pool.query(
          `SELECT id, nombre, precio, categoria, duracion_min, destacado, en_promocion,
                  precio_promocional, promocion_hasta
             FROM procedimientos WHERE categoria = $1 ORDER BY nombre`,
          [args.categoria]
        )
      : await pool.query(
          `SELECT id, nombre, precio, categoria, duracion_min, destacado, en_promocion,
                  precio_promocional, promocion_hasta
             FROM procedimientos ORDER BY categoria, nombre`
        );
    return { procedimientos: rows };
  },

  async crear_procedimiento(args) {
    const { rows } = await pool.query(
      `INSERT INTO procedimientos (nombre, descripcion, precio, categoria, duracion_min)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, precio, categoria, duracion_min`,
      [args.nombre, args.descripcion, args.precio, args.categoria, args.duracion_min]
    );
    return { creado: rows[0] };
  },

  async actualizar_procedimiento(args) {
    const campos = ["nombre", "descripcion", "precio", "categoria", "duracion_min", "destacado"];
    const set = [];
    const vals = [args.id];
    for (const c of campos) {
      if (args[c] !== undefined) {
        vals.push(args[c]);
        set.push(`${c} = $${vals.length}`);
      }
    }
    if (!set.length) return { error: "No se indicó ningún campo a cambiar." };

    const { rows } = await pool.query(
      `UPDATE procedimientos SET ${set.join(", ")}, actualizado_en = now()
        WHERE id = $1
        RETURNING id, nombre, precio, categoria, duracion_min, destacado`,
      vals
    );
    if (!rows.length) return { error: "No existe un procedimiento con ese id." };
    return { actualizado: rows[0] };
  },

  async configurar_promocion(args) {
    const { rows } = await pool.query(
      `UPDATE procedimientos
          SET en_promocion = $2,
              precio_promocional = CASE WHEN $2 THEN $3 ELSE NULL END,
              promocion_hasta    = CASE WHEN $2 THEN $4::date ELSE NULL END,
              actualizado_en = now()
        WHERE id = $1
        RETURNING id, nombre, en_promocion, precio_promocional, promocion_hasta`,
      [args.id, args.en_promocion, args.precio_promocional || null, args.promocion_hasta || null]
    );
    if (!rows.length) return { error: "No existe un procedimiento con ese id." };
    return { promocion: rows[0] };
  },

  async leer_configuracion(args) {
    const { rows } = args.grupo
      ? await pool.query(
          `SELECT clave, valor, etiqueta FROM configuracion_sitio WHERE grupo = $1 ORDER BY orden`,
          [args.grupo]
        )
      : await pool.query(
          `SELECT clave, valor, etiqueta, grupo FROM configuracion_sitio ORDER BY grupo, orden`
        );
    return { configuracion: rows };
  },

  async actualizar_configuracion(args) {
    const claves = args.cambios.map((c) => c.clave);
    const valores = args.cambios.map((c) => String(c.valor));
    const { rows } = await pool.query(
      `UPDATE configuracion_sitio AS c
          SET valor = v.valor, actualizado_en = now()
         FROM unnest($1::text[], $2::text[]) AS v(clave, valor)
        WHERE c.clave = v.clave
      RETURNING c.clave, c.valor`,
      [claves, valores]
    );
    const ignoradas = claves.filter((k) => !rows.some((r) => r.clave === k));
    return {
      actualizadas: rows,
      ...(ignoradas.length ? { ignoradas, nota: "Esas claves no existen y no se tocaron." } : {}),
    };
  },

  async resumen_de_citas(args) {
    // Solo agregados. Ninguna columna que identifique a un paciente.
    const [porEstado, porProcedimiento, total] = await Promise.all([
      pool.query(
        `SELECT estado, count(*)::int AS cantidad FROM citas
          WHERE fecha BETWEEN $1::date AND $2::date GROUP BY estado ORDER BY cantidad DESC`,
        [args.desde, args.hasta]
      ),
      pool.query(
        `SELECT procedimiento, count(*)::int AS cantidad FROM citas
          WHERE fecha BETWEEN $1::date AND $2::date
          GROUP BY procedimiento ORDER BY cantidad DESC LIMIT 10`,
        [args.desde, args.hasta]
      ),
      pool.query(
        `SELECT count(*)::int AS total FROM citas WHERE fecha BETWEEN $1::date AND $2::date`,
        [args.desde, args.hasta]
      ),
    ]);
    return {
      rango: { desde: args.desde, hasta: args.hasta },
      total: total.rows[0].total,
      por_estado: porEstado.rows,
      procedimientos_mas_solicitados: porProcedimiento.rows,
    };
  },
  async citas_del_dia(args) {
    const { rows } = await pool.query(
      `SELECT nombres, apellidos, hora, procedimiento, estado
         FROM citas
        WHERE fecha = $1::date AND estado != 'cancelada'
        ORDER BY hora ASC`,
      [args.fecha]
    );
    return {
      fecha: args.fecha,
      total: rows.length,
      citas: rows.map((r) => ({
        paciente: `${r.nombres} ${r.apellidos || ""}`.trim(),
        hora: r.hora,
        procedimiento: r.procedimiento,
        estado: r.estado,
      })),
    };
  },
};

async function ejecutar(nombre, args) {
  const fn = EJECUTORES[nombre];
  if (!fn) return { error: `Herramienta desconocida: ${nombre}` };
  const problema = validar(nombre, args);
  if (problema) return { error: problema };
  return fn(args);
}

module.exports = { DEFINICIONES, ejecutar, escribe, validar };
