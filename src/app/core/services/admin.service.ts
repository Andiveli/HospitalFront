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

// People Stats
export interface PeopleStatsDto {
  totalMedicos: number;
  totalPacientes: number;
}

export interface PeopleStatsResponseDto {
  message: string;
  data: PeopleStatsDto;
}

// Citas DTOs
export interface MedicoInfoDto {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
}

export interface PacienteInfoDto {
  id: number;
  nombre: string;
  apellido: string;
}

export interface CitaResponseDto {
  id: number;
  fechaHoraCreacion: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  telefonica: boolean;
  estado: string;
  medico: MedicoInfoDto;
  paciente: PacienteInfoDto;
}

export interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CitasPaginadasApiResponseDto {
  message: string;
  data: CitaResponseDto[];
  meta: PaginationMetaDto;
}

const CITA_ESTADO = {
  PENDIENTE: 'pendiente',
  ATENDIDA: 'atendida',
  CANCELADA: 'cancelada',
} as const;

export type CitaEstado = (typeof CITA_ESTADO)[keyof typeof CITA_ESTADO];

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
   * Combina datos de /people/stats y /citas/admin/citas
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [peopleStats, citasData] = await Promise.all([
        this.getPeopleStats(),
        this.getAllCitasAdmin(),
      ]);

      // Contar citas por estado
      const citasAtendidas = citasData.filter((c) => c.estado === 'atendida').length;
      const citasPendientes = citasData.filter((c) => c.estado === 'pendiente').length;
      const citasCanceladas = citasData.filter((c) => c.estado === 'cancelada').length;

      return {
        citasAtendidas,
        citasPendientes,
        citasCanceladas,
        totalMedicos: peopleStats.totalMedicos,
        totalPacientes: peopleStats.totalPacientes,
        excepcionesPendientes: 0, // Se actualiza desde getAllExcepciones
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        citasAtendidas: 0,
        citasPendientes: 0,
        citasCanceladas: 0,
        totalMedicos: 0,
        totalPacientes: 0,
        excepcionesPendientes: 0,
      };
    }
  }

  /**
   * Obtiene estadísticas de personas
   * GET /people/stats
   */
  async getPeopleStats(): Promise<PeopleStatsDto> {
    try {
      const response = await firstValueFrom(
        this.http.get<PeopleStatsResponseDto>(`${this.baseUrl}/people/stats`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching people stats:', error);
      return {
        totalMedicos: 0,
        totalPacientes: 0,
      };
    }
  }

  /**
   * Obtiene todas las citas del sistema (admin)
   * GET /citas/admin/citas
   */
  async getAllCitasAdmin(page = 1, limit = 100): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<CitasPaginadasApiResponseDto>(
          `${this.baseUrl}/citas/admin/citas?page=${page}&limit=${limit}`
        )
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching admin citas:', error);
      return [];
    }
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
