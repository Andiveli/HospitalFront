import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// Admin DTOs
// ==========================================

export interface MedicoExcepcionInfo {
  id: number;
  nombreCompleto: string;
  especialidad: string;
}

export interface ExcepcionAdminDto {
  id: number;
  fecha: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  motivo?: string | null;
  diaCompleto: boolean;
}

export interface MedicoConExcepciones {
  medico: MedicoExcepcionInfo;
  totalExcepciones: number;
  excepciones: ExcepcionAdminDto[];
}

export interface ExcepcionesPorMedicoResponseDto {
  message: string;
  data: MedicoConExcepciones[];
}

export interface DashboardStats {
  citasAtendidas: number;
  citasPendientes: number;
  citasCanceladas: number;
  totalMedicos: number;
  totalPacientes: number;
  excepcionesPendientes: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Obtiene todas las excepciones de horario de todos los médicos
   * GET /excepciones-horario/admin/todas
   */
  async getAllExcepciones(): Promise<MedicoConExcepciones[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ExcepcionesPorMedicoResponseDto>(
          `${this.baseUrl}/excepciones-horario/admin/todas`
        )
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching excepciones:', error);
      return [];
    }
  }

  /**
   * Obtiene excepciones de un médico específico
   * GET /excepciones-horario/admin/medico/{medicoId}
   */
  async getExcepcionesByMedico(medicoId: number): Promise<ExcepcionAdminDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: ExcepcionAdminDto[] }>(
          `${this.baseUrl}/excepciones-horario/admin/medico/${medicoId}`
        )
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching excepciones by medico:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas del dashboard
   * TODO: Implementar endpoint real en backend
   * Por ahora retorna datos de ejemplo
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // TODO: Cuando el backend tenga endpoint de estadísticas, usarlo
    // Por ahora simulamos con datos
    return {
      citasAtendidas: 0,
      citasPendientes: 0,
      citasCanceladas: 0,
      totalMedicos: 0,
      totalPacientes: 0,
      excepcionesPendientes: 0,
    };
  }

  /**
   * Formatea fecha para mostrar
   */
  formatFechaDisplay(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Formatea horario de excepción
   */
  formatHorario(excepcion: ExcepcionAdminDto): string {
    if (excepcion.diaCompleto) {
      return 'Día completo';
    }
    if (excepcion.horaInicio && excepcion.horaFin) {
      return `${excepcion.horaInicio.substring(0, 5)} - ${excepcion.horaFin.substring(0, 5)}`;
    }
    return 'Horario no especificado';
  }

  /**
   * Verifica si una excepción es futura
   */
  isFutureException(fecha: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exceptionDate = new Date(fecha + 'T00:00:00');
    return exceptionDate >= today;
  }
}
