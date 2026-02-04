import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  CreateExcepcionDto,
  ExcepcionApiResponseDto,
  ExcepcionesListApiResponseDto,
  ExcepcionHorarioDto,
} from '../models';

/**
 * Servicio para gestionar excepciones de horario del médico
 * Permite bloquear días completos o franjas horarias específicas
 */
@Injectable({
  providedIn: 'root',
})
export class ExcepcionesHorarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/excepciones-horario/medico`;

  /**
   * Obtiene todas las excepciones de horario del médico autenticado
   * GET /excepciones-horario/medico/mis-excepciones
   */
  async getMisExcepciones(): Promise<ExcepcionHorarioDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ExcepcionesListApiResponseDto>(`${this.baseUrl}/mis-excepciones`)
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Obtiene solo las excepciones futuras del médico autenticado
   * GET /excepciones-horario/medico/mis-excepciones/futuras
   */
  async getExcepcionesFuturas(): Promise<ExcepcionHorarioDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ExcepcionesListApiResponseDto>(`${this.baseUrl}/mis-excepciones/futuras`)
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Crea una nueva excepción de horario
   * POST /excepciones-horario/medico
   *
   * @param dto Datos de la excepción (fecha requerida, horas opcionales)
   * @returns La excepción creada
   * @throws Error si ya existe una excepción para esa fecha o datos inválidos
   */
  async createExcepcion(dto: CreateExcepcionDto): Promise<ExcepcionHorarioDto> {
    const response = await firstValueFrom(
      this.http.post<ExcepcionApiResponseDto>(this.baseUrl, dto)
    );
    return response.data;
  }

  /**
   * Elimina una excepción de horario
   * DELETE /excepciones-horario/medico/:id
   *
   * @param id ID de la excepción a eliminar
   */
  async deleteExcepcion(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
  }

  /**
   * Formatea una fecha para mostrar (DD/MM/YYYY)
   */
  formatFechaDisplay(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Obtiene el nombre del día de la semana
   */
  getDayName(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  /**
   * Formatea el rango horario para mostrar
   */
  formatHorario(excepcion: ExcepcionHorarioDto): string {
    if (excepcion.diaCompleto) {
      return 'Todo el día';
    }
    if (excepcion.horaInicio && excepcion.horaFin) {
      return `${excepcion.horaInicio.substring(0, 5)} - ${excepcion.horaFin.substring(0, 5)}`;
    }
    return 'Horario parcial';
  }

  /**
   * Valida si la fecha es futura (mínimo mañana)
   */
  isFechaValida(fecha: string): boolean {
    const selected = new Date(fecha + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 1);

    return selected >= minDate;
  }

  /**
   * Obtiene la fecha mínima permitida (mañana) en formato YYYY-MM-DD
   */
  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDateForAPI(tomorrow);
  }

  /**
   * Formatea fecha para API (YYYY-MM-DD)
   */
  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
