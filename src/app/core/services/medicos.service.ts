import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  MedicoDisponibleDto,
  BackendMedicosResponseDto,
  DiasAtencionApiResponseDto,
  SlotDisponibleDto,
  DisponibilidadResponseDto,
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MedicosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/citas/medicos`;

  // =====================================
  // GET - List Doctors
  // =====================================

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
      this.http.get<BackendMedicosResponseDto>(this.baseUrl, { params }),
    );

    return response.data || [];
  }

  // =====================================
  // GET - Doctor's Working Days
  // =====================================

  /**
   * Get days a doctor works
   * GET /citas/medicos/{medicoId}/dias-atencion
   *
   * Returns array of working days with time ranges
   * diaSemana: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  /**
   * Get days a doctor works
   * GET /citas/medicos/{medicoId}/dias-atencion
   *
   * Backend returns:
   * {
   *   message: "Días de atención obtenidos exitosamente",
   *   data: {
   *     diasAtencion: ["Lunes", "Miércoles", "Viernes"]
   *   }
   * }
   *
   * @returns Array of day numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   */
  async getDiasAtencion(medicoId: number): Promise<number[]> {
    try {
      console.log('🔄 MedicosService: Solicitando días de atención para médico', medicoId);

      const response = await firstValueFrom(
        this.http.get<DiasAtencionApiResponseDto>(`${this.baseUrl}/${medicoId}/dias-atencion`),
      );

      console.log('✅ MedicosService: Respuesta días de atención:', response);

      const diasStrings = response.data.diasAtencion;
      console.log('📅 MedicosService: Días (strings):', diasStrings);

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
          const number = dayMap[normalized];

          if (number === undefined) {
            console.warn(
              `⚠️ MedicosService: Día no reconocido: "${day}" (normalizado: "${normalized}")`,
            );
          } else {
            console.log(`✅ MedicosService: "${day}" → ${number}`);
          }

          return number;
        })
        .filter((n): n is number => n !== undefined);

      console.log('📅 MedicosService: Días (números 0-6):', dayNumbers);

      return dayNumbers;
    } catch (error) {
      console.error('❌ MedicosService: Error obteniendo días de atención:', error);
      return [];
    }
  }

  // =====================================
  // GET - Doctor's Available Slots
  // =====================================

  /**
   * Get available 30-minute time slots for a specific date
   * GET /citas/medicos/{medicoId}/disponibilidad?fecha=YYYY-MM-DD
   *
   * Backend returns:
   * {
   *   fecha: "2026-01-28",
   *   diaSemana: "Miércoles",
   *   atiende: true,
   *   slots: [{ horaInicio: "14:00", horaFin: "14:30" }, ...],
   *   mensaje?: "El médico no atiende los jueves"
   * }
   *
   * @param medicoId - Doctor ID
   * @param fecha - Date in YYYY-MM-DD format
   * @returns Disponibilidad info with slots array
   */
  async getDisponibilidad(medicoId: number, fecha: string): Promise<DisponibilidadResponseDto> {
    const params = new HttpParams().set('fecha', fecha);

    try {
      console.log(
        '🔄 MedicosService: Solicitando disponibilidad para médico',
        medicoId,
        'fecha',
        fecha,
      );

      const response = await firstValueFrom(
        this.http.get<{ message: string; data: DisponibilidadResponseDto }>(
          `${this.baseUrl}/${medicoId}/disponibilidad`,
          { params },
        ),
      );

      console.log('✅ MedicosService: Respuesta de disponibilidad:', response.data);

      // Unwrap { message, data } response and return the data object
      return response.data;
    } catch (error) {
      console.error('❌ MedicosService: Error obteniendo disponibilidad:', error);
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

  // =====================================
  // HELPER METHODS
  // =====================================

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
