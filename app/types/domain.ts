// app/types/domain.ts
// Tipos de dominio compartidos por todo el frontend.
// Mapean las tablas reales de la BD + algunos tipos auxiliares de UI.

// ============================================================
// USUARIOS / SESIÓN
// ============================================================

export type RolUsuario =
  | "usuario"    // paciente / usuario normal
  | "admin"      // administrador
  | "developer"  // acceso total interno
  | "ayudante";  // recepcionista / asistente

// Usuario "ligero" que suele viajar en la sesión (auth/google, etc.)
export interface SessionUser {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  rol: RolUsuario;
  photo?: string | null;
  creadoEn?: string | null; // DATETIME en BD (opcional en respuestas)
}

// Usuario completo, mapeando la tabla `usuarios` de la BD
// (puedes ir ajustando campos según lo que devuelva tu backend)
export interface User extends SessionUser {
  // Historia clínica simplificada
  antecedentes?: string | null;
  antecedentesDescripcion?: string | null;
  alergias?: string | null;
  alergiasDescripcion?: string | null;
  medicamentos?: string | null;
  medicamentosDescripcion?: string | null;

  // En la BD `creadoEn` es NOT NULL, pero lo dejamos opcional
  // porque algunas respuestas pueden omitirlo
  creadoEn?: string | null;
}

// ============================================================
// CITAS
// ============================================================

export type TipoCita = "valoracion" | "implementacion";

export type MetodoPago = "Consultorio" | "Online";

export type TipoPagoConsultorio = "Efectivo" | "Tarjeta";

export type TipoPagoOnline = "PayU" | "PSE";

export type EstadoCita = "pendiente" | "confirmada" | "atendida" | "cancelada";

export type CreadorCita = "usuario" | "doctora";

// Cita tal como se usa en el front (BD real + campos de UI)
export interface Cita {
  id: number;
  userId: number;

  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;

  procedimiento: string;
  tipoCita: TipoCita;

  nota?: string | null;

  // fecha y hora
  fecha: string; // YYYY-MM-DD (DATE en BD)
  hora: string; // ej. "08:30 AM"

  // Pago
  metodoPago?: MetodoPago | null;
  tipoPagoConsultorio?: TipoPagoConsultorio | null;
  tipoPagoOnline?: TipoPagoOnline | null;
  pagado: boolean;

  monto?: number | null;
  montoPagado?: number | null;
  montoRestante?: number | null;

  // Estado y tracking
  creadaPor: CreadorCita;
  fechaCreacion: string; // ISO / DATETIME
  estado: EstadoCita;

  // Extras
  qrCita?: string | null;
  motivoCancelacion?: string | null;
}

// ============================================================
// PROCEDIMIENTOS
// ============================================================

export type CategoriaProcedimiento = "Facial" | "Corporal" | "Capilar";

export type MediaType = "imagen" | "video";

// Elemento de galería asociado a un procedimiento (solo front)
export interface MediaItem {
  id: string;
  tipo: MediaType;
  url: string;
  titulo?: string;
  descripcion?: string;
}

// Mapea la tabla `procedimientos` + galería opcional en el front
export interface Procedimiento {
  id: number;
  nombre: string;
  desc: string;
  descCompleta?: string;
  // VARCHAR en BD, puede ser "180000", "350.000 – 450.000" o "Según valoración médica"
  precio: string;
  imagen: string;
  categoria: CategoriaProcedimiento;
  duracionMin?: number | null;
  destacado: boolean;
  galeria?: MediaItem[]; // solo para UI, no está en la tabla actual
}

// ============================================================
// TESTIMONIOS
// ============================================================

export interface Testimonio {
  id: number;
  nombre: string;
  texto: string;
  video: string;
  thumb: string;
  activo: boolean;
  destacado: boolean;
  creadoEn: string; // DATETIME
}

// ============================================================
// CHARLAS / FORMACIÓN
// ============================================================

export interface Charla {
  id: number;
  titulo: string;
  descripcion: string;
  detalle: string;
  imagen: string;
  fecha?: string | null; // YYYY-MM-DD (DATE en BD)
  // Si quieres manejar galería en front, puedes añadir:
  galeria?: string[]; // urls de imágenes / videos (solo UI)
}

// ============================================================
// BLOQUEOS DE HORAS
// ============================================================

export interface BloqueoHora {
  id: number;
  fechaISO: string; // YYYY-MM-DD
  hora: string; // "08:30 AM"
  motivo: string;
}

// ============================================================
// HORARIOS Y DISPONIBILIDAD (solo lógica de front)
// ============================================================

// Hora disponible de un día específico
export interface HoraDisponible {
  hora: string; // ej: "08:30 AM"
  disponible: boolean;
  bloqueadoPor?: string | null;
  idCita?: number | null;
}

// Horario calculado para una fecha concreta
export interface HorarioPorFecha {
  fecha: string; // YYYY-MM-DD
  horas: HoraDisponible[];
}

// Horario global por día de la semana (0=domingo ... 6=sábado)
export interface HorarioGlobal {
  dia: number;
  horas: string[]; // lista de horas tipo "08:30 AM"
}