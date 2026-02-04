import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  CreatePacienteEnfermedadDto,
  EnfermedadDto,
  EnfermedadesListResponseDto,
  PacienteEnfermedadDto,
  PacienteEnfermedadesListResponseDto,
  PacienteEnfermedadResponseDto,
  TipoEnfermedadDto,
  TiposEnfermedadResponseDto,
} from '../models';

/**
 * Servicio para gestionar enfermedades y relaciones paciente-enfermedad
 *
 * Endpoints:
 * - GET /enfermedades/listEnfermedades (catálogo de enfermedades)
 * - GET /tipo-enfermedad/tipos (tipos de enfermedad)
 * - POST /paciente-enfermedad (crear relación - solo médicos)
 * - GET /paciente-enfermedad/paciente/:pacienteId (enfermedades del paciente)
 */
@Injectable({
  providedIn: 'root',
})
export class EnfermedadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ==========================================
  // Catálogo de Enfermedades
  // ==========================================

  /**
   * Obtiene el listado completo de enfermedades del catálogo médico
   * Accesible para todos los usuarios autenticados
   */
  async getEnfermedades(): Promise<EnfermedadDto[]> {
    const response = await firstValueFrom(
      this.http.get<EnfermedadesListResponseDto>(`${this.baseUrl}/enfermedades/listEnfermedades`)
    );
    return response.data;
  }

  // ==========================================
  // Tipos de Enfermedad
  // ==========================================

  /**
   * Obtiene los tipos de enfermedad disponibles
   * (antecedente, alergia, hereditaria, etc.)
   */
  async getTiposEnfermedad(): Promise<TipoEnfermedadDto[]> {
    const response = await firstValueFrom(
      this.http.get<TiposEnfermedadResponseDto>(`${this.baseUrl}/tipo-enfermedad/tipos`)
    );
    return response.data;
  }

  // ==========================================
  // Paciente-Enfermedad (Solo Médicos)
  // ==========================================

  /**
   * Crea una nueva relación entre un paciente y una enfermedad
   * Solo médicos pueden ejecutar esta acción
   *
   * @param dto Datos de la relación a crear
   * @throws 403 si no es médico
   * @throws 409 si el paciente ya tiene esta enfermedad registrada
   */
  async createPacienteEnfermedad(dto: CreatePacienteEnfermedadDto): Promise<PacienteEnfermedadDto> {
    const response = await firstValueFrom(
      this.http.post<PacienteEnfermedadResponseDto | PacienteEnfermedadDto>(
        `${this.baseUrl}/paciente-enfermedad`,
        dto
      )
    );

    // El backend puede devolver { data: ... } o directamente la entidad
    if ('data' in response && response.data) {
      return response.data;
    }

    // Si no tiene wrapper, es la entidad directamente
    return response as PacienteEnfermedadDto;
  }

  /**
   * Obtiene las enfermedades registradas de un paciente específico
   *
   * @param pacienteId ID del paciente
   */
  async getEnfermedadesPaciente(pacienteId: number): Promise<PacienteEnfermedadDto[]> {
    const response = await firstValueFrom(
      this.http.get<PacienteEnfermedadesListResponseDto>(
        `${this.baseUrl}/paciente-enfermedad/paciente/${pacienteId}`
      )
    );
    return response.data;
  }

  /**
   * Elimina una relación paciente-enfermedad
   *
   * @param pacienteId ID del paciente
   * @param enfermedadId ID de la enfermedad
   */
  async deletePacienteEnfermedad(pacienteId: number, enfermedadId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.baseUrl}/paciente-enfermedad/${pacienteId}/${enfermedadId}`)
    );
  }
}
