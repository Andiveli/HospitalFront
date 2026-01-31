// ==========================================
// Medico DTOs - Based on Backend API
// ==========================================

// Nota: EspecialidadDto se importa desde citas.models
// Usar: import { EspecialidadDto } from './citas.models';

/**
 * Perfil Profesional del Médico
 * GET /medicos/perfil
 */
export interface MedicoPerfilDto {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento?: string;
  genero: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  especialidad: {
    id: number;
    nombre: string;
    descripcion?: string | null;
  };
  subespecialidad?: string;
  numeroRegistroProfesional: string;
  biografia?: string;
  fotoPerfil?: string;
  aniosExperiencia: number;
  consultasAtendidas: number;
  calificacionPromedio: number;
  verificado: boolean;
  createdAt: string;
}

/**
 * Horario de Atención del Médico
 * GET /medicos/horarios
 */
export interface HorarioAtencionDto {
  id: number;
  diaSemana: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
  horaInicioManana?: string;
  horaFinManana?: string;
  horaInicioTarde?: string;
  horaFinTarde?: string;
  activo: boolean;
}

/**
 * Crear/Actualizar Horario de Atención
 * POST /medicos/horarios
 */
export interface CreateHorarioDto {
  diaSemana: string;
  horaInicioManana?: string;
  horaFinManana?: string;
  horaInicioTarde?: string;
  horaFinTarde?: string;
}

/**
 * Resumen de paciente para consultas
 */
export interface PacienteResumenDto {
  id: number;
  nombres: string;
  apellidos: string;
  edad: number;
  genero: string;
}

/**
 * Consulta Médica asignada al médico
 * GET /medicos/consultas
 */
export interface ConsultaMedicaDto {
  id: number;
  paciente: PacienteResumenDto;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  tipo: 'VIRTUAL' | 'PRESENCIAL';
  motivo: string;
  notasMedicas?: string;
}

/**
 * Respuesta del backend para perfil de médico
 */
export interface BackendMedicoPerfilResponseDto {
  message: string;
  data: MedicoPerfilDto;
}

/**
 * Respuesta del backend para lista de horarios
 */
export interface BackendHorariosResponseDto {
  message: string;
  data: HorarioAtencionDto[];
}

/**
 * Respuesta del backend para lista de consultas
 */
export interface BackendConsultasResponseDto {
  message: string;
  data: ConsultaMedicaDto[];
}

/**
 * Update Perfil Profesional Request
 * PUT /medicos/perfil
 */
export interface UpdateMedicoPerfilDto {
  telefono?: string;
  subespecialidad?: string;
  biografia?: string;
  fotoPerfil?: string;
  aniosExperiencia?: number;
}

/**
 * Excepción de horario (para días especiales)
 */
export interface ExcepcionHorarioDto {
  id: number;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  motivo: string;
  disponible: boolean; // false = no atiende ese día
}
