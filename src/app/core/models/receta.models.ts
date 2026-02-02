// ==========================================
// Receta Models
// ==========================================

/**
 * DTO de respuesta para el endpoint /recetas/paciente/mis-recetas
 */
export interface MisRecetasResponseDto {
  message: string;
  data: RecetasPacienteResponseDto;
}

/**
 * DTO con la información completa de recetas del paciente
 */
export interface RecetasPacienteResponseDto {
  pacienteId: number;
  totalRecetas: number;
  recetas: RecetaPacienteDto[];
}

/**
 * DTO de una receta individual del paciente
 */
export interface RecetaPacienteDto {
  id: number;
  fechaHoraCreacion: string;
  medico: MedicoRecetaPacienteDto;
  diagnostico: string;
  observacionesAtencion: string;
  observacionesReceta: string;
  medicamentos: MedicamentoRecetaPacienteDto[];
}

/**
 * DTO de información del médico en la receta
 */
export interface MedicoRecetaPacienteDto {
  id: number;
  nombreCompleto: string;
  especialidad: string;
}

/**
 * DTO de medicamento en la receta
 */
export interface MedicamentoRecetaPacienteDto {
  nombre: string;
  principioActivo: string;
  concentracion: string;
  presentacion: string;
  duracion: string;
  frecuencia: string;
  cantidad: number;
  viaAdministracion: string;
  unidadMedida: string;
  indicaciones: string;
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Formatea la fecha de la receta para mostrar en la UI
 * Convierte ISO 8601 a formato legible
 */
export function formatRecetaDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  // Si es hoy
  if (diffDays === 0) {
    return 'Hoy';
  }

  // Si es ayer
  if (diffDays === 1) {
    return 'Ayer';
  }

  // Si es esta semana (menos de 7 días)
  if (diffDays < 7) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  // Formato: "15 de diciembre de 2025"
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Formatea la hora de la receta
 */
export function formatRecetaTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtiene el resumen del tratamiento para mostrar en la lista
 */
export function getTratamientoResumen(medicamentos: MedicamentoRecetaPacienteDto[]): string {
  if (medicamentos.length === 0) {
    return 'Sin medicamentos';
  }

  if (medicamentos.length === 1) {
    return medicamentos[0].nombre;
  }

  return `${medicamentos[0].nombre} + ${medicamentos.length - 1} más`;
}
