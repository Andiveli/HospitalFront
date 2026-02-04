// ==========================================
// Historia Clínica DTOs - Based on Backend API
//
// Nuevos Endpoints:
// - GET /historia-clinica/mi-historia (Paciente - obtiene su propia historia)
// - GET /historia-clinica/paciente/:pacienteId (Médico - obtiene historia de cualquier paciente)
// - GET /historia-clinica/:pacienteId (Flexible - pacientes solo la suya, médicos cualquiera)
//
// Nota: Cuando no existe historia clínica, el backend devuelve HistoriaClinicaNoExisteDto
// con existe: false y un mensaje informativo
// ==========================================

/**
 * Respuesta cuando el paciente NO tiene historia clínica
 */
export interface HistoriaClinicaNoExisteDto {
  existe: false;
  message: string;
}

/**
 * Información del paciente en la historia clínica
 */
export interface PacienteHistoriaDto {
  id: number;
  nombreCompleto: string;
  fechaNacimiento: string;
  genero: string;
  tipoSangre?: string;
  estadoVida?: string;
  estiloVida?: string;
}

/**
 * Enfermedad/condición del paciente
 */
export interface EnfermedadHistoriaDto {
  nombre: string;
  tipo: string;
  observaciones?: string;
}

/**
 * Medicamento recetado
 */
export interface MedicamentoHistoriaDto {
  nombre: string;
  duracion: string;
  frecuencia: string;
  cantidad: number;
  viaAdministracion: string;
}

/**
 * Receta médica dentro de la historia clínica
 */
export interface RecetaHistoriaDto {
  id: number;
  fechaEmision: string;
  medicoNombre: string;
  medicoEspecialidad: string;
  diagnostico: string;
  observaciones?: string;
  medicamentos: MedicamentoHistoriaDto[];
}

/**
 * Cita médica en la historia clínica
 */
export interface CitaHistoriaDto {
  id: number;
  fecha: string;
  estado: string;
  medicoNombre: string;
  medicoEspecialidad: string;
  diagnostico?: string;
  observaciones?: string;
  tieneReceta: boolean;
  receta?: RecetaHistoriaDto;
}

/**
 * Documento médico en la historia clínica
 */
export interface DocumentoHistoriaDto {
  id: number;
  titulo: string;
  tipo: string;
  fechaSubida: string;
}

/**
 * Resumen estadístico de la historia clínica
 */
export interface ResumenHistoriaDto {
  totalCitas: number;
  totalRecetas: number;
  totalDocumentos: number;
  totalEnfermedades: number;
  ultimaAtencion?: string;
  proximaCita?: string;
}

/**
 * Historia Clínica completa
 * Nota: Todas las propiedades son opcionales porque cuando no existe historia,
 * el backend devuelve solo { existe: false, message: string }
 */
export interface HistoriaClinicaResponseDto {
  existe?: boolean;
  id?: number;
  paciente?: PacienteHistoriaDto;
  enfermedades?: EnfermedadHistoriaDto[];
  citas?: CitaHistoriaDto[];
  documentos?: DocumentoHistoriaDto[];
  resumen?: ResumenHistoriaDto;
  message?: string;
}

/**
 * Type guard para verificar si la historia clínica existe
 */
export function historiaClinicaExiste(
  historia: HistoriaClinicaResponseDto | null
): historia is HistoriaClinicaResponseDto & {
  existe: true;
  id: number;
  paciente: PacienteHistoriaDto;
  enfermedades: EnfermedadHistoriaDto[];
  citas: CitaHistoriaDto[];
  documentos: DocumentoHistoriaDto[];
} {
  return historia !== null && historia.existe !== false;
}

/**
 * Respuesta del backend para historia clínica
 */
export interface HistoriaClinicaApiResponseDto {
  message: string;
  data: HistoriaClinicaResponseDto;
}
