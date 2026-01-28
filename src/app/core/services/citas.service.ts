import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import {
  CitaResponseDto,
  CitaDetalladaResponseDto,
  CreateCitaDto,
  UpdateCitaDto,
  PaginationParams,
  PaginatedResponse,
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CitasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/citas`;

  // =====================================
  // GET - List Appointments
  // =====================================

  /**
   * Get next 3 upcoming appointments
   * GET /citas/proximas
   * 
   * Backend returns: { message: string, data: CitaResponseDto[] }
   */
  async getProximasCitas(): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(`${this.baseUrl}/proximas`)
      );
      console.log('✅ CitasService: Próximas citas:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('❌ CitasService: Error obteniendo próximas citas:', error);
      return [];
    }
  }

  /**
   * Get last 4 attended appointments
   * GET /citas/recientes
   * 
   * Backend returns: { message: string, data: CitaResponseDto[] }
   */
  async getRecientesCitas(): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(`${this.baseUrl}/recientes`)
      );
      console.log('✅ CitasService: Citas recientes:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('❌ CitasService: Error obteniendo citas recientes:', error);
      return [];
    }
  }

  /**
   * Get all pending appointments (paginated)
   * GET /citas/pendientes?page=1&limit=10
   */
  async getPendientesCitas(
    params: PaginationParams
  ): Promise<PaginatedResponse<CitaResponseDto>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    return firstValueFrom(
      this.http.get<PaginatedResponse<CitaResponseDto>>(
        `${this.baseUrl}/pendientes`,
        { params: httpParams }
      )
    );
  }

  /**
   * Get all attended appointments (paginated)
   * GET /citas/atendidas?page=1&limit=10
   */
  async getAtendidasCitas(
    params: PaginationParams
  ): Promise<PaginatedResponse<CitaResponseDto>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    return firstValueFrom(
      this.http.get<PaginatedResponse<CitaResponseDto>>(
        `${this.baseUrl}/atendidas`,
        { params: httpParams }
      )
    );
  }

  /**
   * Get appointment details (includes diagnosis, prescriptions, referrals)
   * GET /citas/{id}
   * 
   * Backend returns: { message: string, data: CitaDetalladaResponseDto }
   */
  async getCitaDetalle(id: number): Promise<CitaDetalladaResponseDto> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaDetalladaResponseDto }>(`${this.baseUrl}/${id}`)
      );
      console.log('✅ CitasService: Detalle de cita:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ CitasService: Error obteniendo detalle de cita:', error);
      throw error;
    }
  }

  // =====================================
  // POST - Create Appointment
  // =====================================

  /**
   * Create a new appointment
   * POST /citas
   * 
   * Requirements:
   * - medicoId: number
   * - fechaHoraInicio: ISO 8601 string
   * - telefonica: boolean
   */
  async createCita(dto: CreateCitaDto): Promise<CitaResponseDto> {
    return firstValueFrom(
      this.http.post<CitaResponseDto>(this.baseUrl, dto)
    );
  }

  // =====================================
  // PUT - Update Appointment
  // =====================================

  /**
   * Update an existing appointment
   * PUT /citas/{id}
   * 
   * Restrictions:
   * - Only pending appointments can be updated
   * - Must be 72+ hours in advance
   */
  async updateCita(id: number, dto: UpdateCitaDto): Promise<CitaResponseDto> {
    return firstValueFrom(
      this.http.put<CitaResponseDto>(`${this.baseUrl}/${id}`, dto)
    );
  }

  // =====================================
  // DELETE - Cancel Appointment
  // =====================================

  /**
   * Cancel an appointment
   * DELETE /citas/{id}
   * 
   * Restrictions:
   * - Only pending appointments can be cancelled
   * - Must be 72+ hours in advance
   */
  async cancelCita(id: number): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`)
    );
  }

  // =====================================
  // HELPER METHODS
  // =====================================

  /**
   * Check if appointment can be modified or cancelled
   * (Must be 72+ hours in advance)
   */
  canModifyCita(fechaHoraInicio: string): boolean {
    const citaDate = new Date(fechaHoraInicio);
    const now = new Date();
    const hoursUntilCita = (citaDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilCita >= 72;
  }

  /**
   * Format date for API (ISO 8601)
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString();
  }
}
