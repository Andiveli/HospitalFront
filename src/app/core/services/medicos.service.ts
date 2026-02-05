import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  BackendMedicosResponseDto,
  DiasAtencionApiResponseDto,
  DisponibilidadResponseDto,
  MedicoDisponibleDto,
} from '../models';

// ==========================================
// Admin - DTOs
// ==========================================

export interface EspecialidadCatalogoDto {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface DiaCatalogoDto {
  id: number;
  nombre: string;
}

export interface EspecialidadDto {
  especialidadNombre: string;
  principal: boolean;
}

export interface HorarioDto {
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
}

export interface AssignMedicoDto {
  usuarioId: number;
  pasaporte?: string;
  licenciaMedica: string;
  especialidades: EspecialidadDto[];
  horarios: HorarioDto[];
}

export interface CreateMedicoResponseDto {
  message: string;
  data: {
    id: number;
    usuarioId: number;
    licenciaMedica: string;
  };
}

export interface UsuarioSimpleDto {
  id: number;
  cedula: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  email: string;
  verificado: boolean;
  imageUrl?: string;
}

export interface MedicoResponseDto {
  nombreCompleto: string;
  email: string;
  cedula: string;
  licenciaMedica: string;
  pasaporte: string;
  especialidades: string[];
  horarios: string[];
  citasAtendidas: number;
}

export interface GetMedicosResponseDto {
  message: string;
  data: MedicoResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MedicosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/citas/medicos`;
  private readonly adminBaseUrl = `${environment.apiUrl}/medicos`;
  private readonly peopleBaseUrl = `${environment.apiUrl}/people`;

  /**
   * Get list of available doctors
   * GET /citas/medicos?especialidadId=X (optional filter)
   */
  async getMedicos(especialidadId?: number): Promise<MedicoDisponibleDto[]> {
    let params = new HttpParams();
    if (especialidadId) {
      params = params.set('especialidadId', especialidadId.toString());
    }

    const response = await firstValueFrom(
      this.http.get<BackendMedicosResponseDto>(this.baseUrl, { params })
    );

    return response.data || [];
  }

  /**
   * Get days a doctor works
   *
   * @returns Array of day numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   */
  async getDiasAtencion(medicoId: number): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<DiasAtencionApiResponseDto>(`${this.baseUrl}/${medicoId}/dias-atencion`)
      );

      const diasStrings = response.data.diasAtencion;

      const dayMap: Record<string, number> = {
        domingo: 0,
        lunes: 1,
        martes: 2,
        miercoles: 3,
        miércoles: 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
        sábado: 6,
      };

      const dayNumbers = diasStrings
        .map((day) => {
          const normalized = day.toLowerCase().trim();
          return dayMap[normalized];
        })
        .filter((n): n is number => n !== undefined);

      return dayNumbers;
    } catch {
      return [];
    }
  }

  /**
   * Get available 30-minute time slots for a specific date
   *
   * @param medicoId - Doctor ID
   * @param fecha - Date in YYYY-MM-DD format
   * @returns Disponibilidad info with slots array
   */
  async getDisponibilidad(medicoId: number, fecha: string): Promise<DisponibilidadResponseDto> {
    const params = new HttpParams().set('fecha', fecha);

    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: DisponibilidadResponseDto }>(
          `${this.baseUrl}/${medicoId}/disponibilidad`,
          { params }
        )
      );

      return response.data;
    } catch {
      return {
        fecha,
        diaSemana: '',
        atiende: false,
        slots: [],
        mensaje: 'Error al obtener disponibilidad',
      };
    }
  }

  /**
   * Format date for API (YYYY-MM-DD) - using LOCAL timezone
   */
  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayFormatted(): string {
    return this.formatDateForAPI(new Date());
  }

  /**
   * Get tomorrow's date in YYYY-MM-DD format
   */
  getTomorrowFormatted(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDateForAPI(tomorrow);
  }

  /**
   * Get day name from date
   */
  getDayName(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  // ==========================================
  // Admin Methods
  // ==========================================

  /**
   * Obtiene todos los médicos del sistema (Admin)
   * GET /medicos?page=X&limit=Y
   */
  async getAllMedicos(page = 1, limit = 10): Promise<GetMedicosResponseDto> {
    try {
      const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

      const response = await firstValueFrom(
        this.http.get<GetMedicosResponseDto>(this.adminBaseUrl, { params })
      );

      // Asegurar que siempre retornemos una estructura válida
      return {
        message: response.message || 'OK',
        data: response.data || [],
        meta: response.meta || {
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Error en getAllMedicos:', error);
      // Retornar estructura vacía en caso de error para que el componente pueda manejarlo
      return {
        message: 'Error al obtener médicos',
        data: [],
        meta: {
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Obtiene todas las especialidades del sistema
   * GET /especialidades
   */
  async getEspecialidades(): Promise<EspecialidadCatalogoDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: EspecialidadCatalogoDto[] }>(
          `${environment.apiUrl}/especialidades?limit=100`
        )
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching especialidades:', error);
      return [];
    }
  }

  /**
   * Genera array de días de la semana
   * No requiere endpoint, es data estática
   */
  getDiasDisponibles(): DiaCatalogoDto[] {
    return [
      { id: 1, nombre: 'Lunes' },
      { id: 2, nombre: 'Martes' },
      { id: 3, nombre: 'Miércoles' },
      { id: 4, nombre: 'Jueves' },
      { id: 5, nombre: 'Viernes' },
      { id: 6, nombre: 'Sábado' },
      { id: 7, nombre: 'Domingo' },
    ];
  }

  /**
   * Obtiene lista de pacientes
   * GET /people/pacientes
   * Nota: La respuesta es un array directo
   */
  async getPacientes(): Promise<UsuarioSimpleDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<UsuarioSimpleDto[]>(`${this.peopleBaseUrl}/pacientes`)
      );
      return response || [];
    } catch (error) {
      console.error('Error fetching pacientes:', error);
      return [];
    }
  }

  /**
   * Asigna rol de médico a un usuario existente
   * POST /medicos/assign
   */
  async assignMedico(data: AssignMedicoDto): Promise<CreateMedicoResponseDto> {
    const response = await firstValueFrom(
      this.http.post<CreateMedicoResponseDto>(`${this.adminBaseUrl}/assign`, data)
    );
    return response;
  }
}
