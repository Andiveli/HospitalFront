// Export all models from a single entry point

export * from './api.models';
export * from './auth.models';
export * from './citas.models';
export * from './document.models';
export * from './enfermedad.models';
export * from './historia-clinica.models';
// Re-exportar tipos de medico.models sin conflictos
export type {
  BackendConsultasResponseDto,
  BackendHorariosResponseDto,
  ConsultaMedicaDto,
  CreateExcepcionDto,
  CreateHorarioDto,
  ExcepcionApiResponseDto,
  ExcepcionesListApiResponseDto,
  ExcepcionHorarioDto,
  HorarioAtencionDto,
  PacienteResumenDto,
  UpdateExcepcionDto,
  UpdateMedicoPerfilDto,
} from './medico.models';
export * from './receta.models';
