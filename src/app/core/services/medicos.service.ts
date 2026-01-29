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

@Injectable({
  providedIn: 'root',
})
export class MedicosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/citas/medicos`;

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

      // Map Spanish day names to numbers (0-6)
      // Handle multiple variations (with/without accents, case insensitive)
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

      // Unwrap { message, data } response and return the data object
      return response.data;
    } catch {
      // Return empty disponibilidad on error
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
   * Format date for API (YYYY-MM-DD)
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
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
}
