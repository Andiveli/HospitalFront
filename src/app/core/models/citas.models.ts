// =====================================
// CITAS (APPOINTMENTS) MODELS
// =====================================

// Simplified medico info in list responses
export interface MedicoSimplificadoDto {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string; // Simple string, not object
}

// Base Appointment Response (for lists)
export interface CitaResponseDto {
  id: number;
  fechaHoraCreacion: string; // ISO 8601
  fechaHoraInicio: string; // ISO 8601
  fechaHoraFin: string; // ISO 8601
  telefonica: boolean;
  estado: string; // "pendiente", "atendida", "cancelada"
  medico: MedicoSimplificadoDto;
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

// Detailed Appointment Response (includes diagnosis, prescriptions, referrals)
export interface CitaDetalladaResponseDto {
  id: number;
  fechaHoraCreacion: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  telefonica: boolean;
  estado: string; // "pendiente", "atendida", "cancelada"
  medico: MedicoSimplificadoDto;
  paciente: {
    id: number;
    nombre: string;
    apellido: string;
  };
  motivoCita?: string; // Solo si fue atendida
  diagnostico?: string; // Solo si fue atendida
  observaciones?: string; // Solo si fue atendida
  tieneReceta: boolean;
  tieneDerivaciones: boolean;
}

// Prescription DTO
export interface RecetaDto {
  id: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  observaciones: string | null;
  createdAt: string;
}

// Referral DTO
export interface DerivacionDto {
  id: number;
  especialidad: string;
  motivo: string;
  observaciones: string | null;
  createdAt: string;
}

// Create Appointment DTO
export interface CreateCitaDto {
  medicoId: number;
  fechaHoraInicio: string; // ISO 8601
  telefonica: boolean;
}

// Update Appointment DTO
export interface UpdateCitaDto {
  medicoId?: number;
  fechaHoraInicio?: string;
  telefonica?: boolean;
}

// =====================================
// MEDICOS (DOCTORS) MODELS
// =====================================

// Backend response wrapper
export interface BackendMedicosResponseDto {
  message: string;
  data: MedicoDisponibleDto[];
}

export interface MedicoDisponibleDto {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: {
    id: number;
    nombre: string;
  }[];
}

// Doctor's working days (backend response)
export interface DiasAtencionResponseDto {
  diasAtencion: string[]; // ["Lunes", "Miércoles", "Viernes"]
}

// Backend wrapper for dias-atencion endpoint
export interface DiasAtencionApiResponseDto {
  message: string;
  data: DiasAtencionResponseDto;
}

// Legacy model (kept for compatibility, but not used by backend)
export interface DiaAtencionDto {
  diaSemana: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  horaInicio: string; // HH:mm format
  horaFin: string; // HH:mm format
}

// Available time slots (NOTE: backend doesn't include 'disponible' field)
export interface SlotDisponibleDto {
  horaInicio: string; // HH:mm format
  horaFin: string; // HH:mm format
}

// Backend response for disponibilidad endpoint
export interface DisponibilidadResponseDto {
  fecha: string; // YYYY-MM-DD
  diaSemana: string; // "Lunes", "Martes", etc.
  atiende: boolean; // true if doctor works this day
  slots: SlotDisponibleDto[]; // Available slots (only if atiende = true)
  mensaje?: string; // Error message if atiende = false
}

// =====================================
// ESPECIALIDADES (SPECIALTIES) MODELS
// =====================================

export interface EspecialidadDto {
  id: number;
  nombre: string;
  descripcion: string | null;
}

// =====================================
// HELPER TYPES
// =====================================

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Day selector options
export const DIAS_SEMANA = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
} as const;

// Appointment status helpers
export type CitaStatus = 'pendiente' | 'atendida' | 'cancelada';

export function getCitaStatus(cita: CitaResponseDto): CitaStatus {
  // Backend now returns 'estado' field directly
  const estado = cita.estado.toLowerCase();
  if (estado === 'atendida') return 'atendida';
  if (estado === 'cancelada') return 'cancelada';
  return 'pendiente';
}

// Date helpers
export function formatMedicoNombre(medico: MedicoDisponibleDto): string {
  return `Dr. ${medico.nombre} ${medico.apellido}`;
}

// Helper para formatear médico simplificado (en listas)
export function formatMedicoNombreSimplificado(medico: MedicoSimplificadoDto): string {
  return `Dr. ${medico.nombre} ${medico.apellido}`;
}
