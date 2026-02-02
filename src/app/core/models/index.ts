// Export all models from a single entry point

export * from './api.models';
export * from './auth.models';
export * from './citas.models';
export * from './document.models';
// Re-exportar tipos de medico.models sin conflictos
export type {
  BackendConsultasResponseDto,
  BackendHorariosResponseDto,
  ConsultaMedicaDto,
  CreateHorarioDto,
  ExcepcionHorarioDto,
  HorarioAtencionDto,
  PacienteResumenDto,
  UpdateMedicoPerfilDto,
} from './medico.models';
export * from './receta.models';
