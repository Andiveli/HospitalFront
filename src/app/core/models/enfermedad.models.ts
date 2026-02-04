// ==========================================
// Enfermedad DTOs - Based on Backend API
//
// Endpoints:
// - GET /enfermedades/listEnfermedades (Lista de enfermedades del catálogo)
// - GET /tipo-enfermedad/tipos (Lista de tipos de enfermedad)
// - POST /paciente-enfermedad (Crear relación paciente-enfermedad)
// - GET /paciente-enfermedad/paciente/:pacienteId (Enfermedades del paciente)
// ==========================================

/**
 * Enfermedad del catálogo médico
 * Endpoint: GET /enfermedades/listEnfermedades
 */
export interface EnfermedadDto {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Respuesta del listado de enfermedades
 * Nota: El backend puede usar 'msg' o 'message'
 */
export interface EnfermedadesListResponseDto {
  msg?: string;
  message?: string;
  data: EnfermedadDto[];
}

/**
 * Tipo de enfermedad (antecedente, alergia, etc.)
 * Endpoint: GET /tipo-enfermedad/tipos
 */
export interface TipoEnfermedadDto {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * Respuesta del listado de tipos de enfermedad
 * Nota: El backend puede usar 'msg' o 'message'
 */
export interface TiposEnfermedadResponseDto {
  msg?: string;
  message?: string;
  data: TipoEnfermedadDto[];
}

/**
 * DTO para crear relación paciente-enfermedad
 * Endpoint: POST /paciente-enfermedad
 * Solo médicos pueden crear estas relaciones
 */
export interface CreatePacienteEnfermedadDto {
  pacienteId: number;
  enfermedadId: number;
  tipoEnfermedadId: number;
  detalle?: string;
}

/**
 * Relación paciente-enfermedad (respuesta)
 */
export interface PacienteEnfermedadDto {
  id: number;
  pacienteId: number;
  enfermedad: EnfermedadDto;
  tipoEnfermedad: TipoEnfermedadDto;
  detalle?: string;
  fechaRegistro: string;
}

/**
 * Respuesta al crear paciente-enfermedad
 * Nota: El backend puede usar 'msg' o 'message'
 */
export interface PacienteEnfermedadResponseDto {
  msg?: string;
  message?: string;
  data: PacienteEnfermedadDto;
}

/**
 * Lista de enfermedades de un paciente
 * Nota: El backend puede usar 'msg' o 'message'
 */
export interface PacienteEnfermedadesListResponseDto {
  msg?: string;
  message?: string;
  data: PacienteEnfermedadDto[];
}
