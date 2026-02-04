import { HttpClient, type HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type {
  ApiError,
  CitaDetalladaResponseDto,
  CitaResponseDto,
  CreateCitaDto,
  PaginatedResponse,
  PaginationParams,
  UpdateCitaDto,
} from '../models';

/**
 * Error personalizado para citas
 */
export interface CitasError extends Error {
  statusCode?: number;
  backendMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CitasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/citas`;

  /**
   * Extrae el mensaje de error del backend
   */
  private handleError(error: HttpErrorResponse): never {
    let errorMessage = 'Error al procesar la cita';
    let backendMessage: string | undefined;

    if (error.error && typeof error.error === 'object') {
      const apiError = error.error as ApiError;
      backendMessage = apiError.message;
      errorMessage = apiError.message || errorMessage;
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado';
    } else if (error.status === 404) {
      errorMessage = backendMessage || 'Cita no encontrada';
    } else if (error.status === 409) {
      errorMessage = backendMessage || 'Conflicto al procesar la cita';
    } else if (error.status >= 500) {
      errorMessage = 'Error en el servidor';
    }

    const customError = new Error(errorMessage) as CitasError;
    customError.statusCode = error.status;
    customError.backendMessage = backendMessage;
    throw customError;
  }

  /**
   * Get next 3 upcoming appointments (para pacientes)
   * GET /citas/paciente/proximas
   */
  async getProximasCitas(): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(
          `${this.baseUrl}/paciente/proximas`
        )
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Get last 4 attended appointments (para pacientes)
   * GET /citas/paciente/recientes
   */
  async getRecientesCitas(): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(
          `${this.baseUrl}/paciente/recientes`
        )
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Get all pending appointments with pagination (para pacientes)
   * GET /citas/paciente/pendientes?page=1&limit=10
   */
  async getPendientesCitas(params: PaginationParams): Promise<PaginatedResponse<CitaResponseDto>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    return firstValueFrom(
      this.http.get<PaginatedResponse<CitaResponseDto>>(`${this.baseUrl}/paciente/pendientes`, {
        params: httpParams,
      })
    );
  }

  /**
   * Get all attended appointments with pagination (para pacientes)
   * GET /citas/paciente/atendidas?page=1&limit=10
   */
  async getAtendidasCitas(params: PaginationParams): Promise<PaginatedResponse<CitaResponseDto>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    return firstValueFrom(
      this.http.get<PaginatedResponse<CitaResponseDto>>(`${this.baseUrl}/paciente/atendidas`, {
        params: httpParams,
      })
    );
  }

  /**
   * Get next upcoming appointments for doctor
   * GET /citas/medico/proximas
   */
  async getProximasCitasMedico(): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(
          `${this.baseUrl}/medico/proximas`
        )
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Get all appointments for doctor (paginated)
   * GET /citas/medico/all
   */
  async getAllCitasMedico(): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(`${this.baseUrl}/medico/all`)
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Get appointments for doctor filtered by date
   * GET /citas/medico/fecha?fecha=YYYY-MM-DD
   */
  async getCitasMedicoPorFecha(fecha: string): Promise<CitaResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ message: string; data: CitaResponseDto[] }>(
          `${this.baseUrl}/medico/fecha?fecha=${fecha}`
        )
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Get appointment details for patient
   * GET /citas/paciente/{id}
   */
  async getCitaDetalle(id: number): Promise<CitaDetalladaResponseDto> {
    const response = await firstValueFrom(
      this.http.get<{ message: string; data: CitaDetalladaResponseDto }>(
        `${this.baseUrl}/paciente/${id}`
      )
    );
    return response.data;
  }

  /**
   * Get appointment details for doctor
   * GET /citas/medico/{id}
   */
  async getCitaDetalleMedico(id: number): Promise<CitaDetalladaResponseDto> {
    const response = await firstValueFrom(
      this.http.get<{ message: string; data: CitaDetalladaResponseDto }>(
        `${this.baseUrl}/medico/${id}`
      )
    );
    return response.data;
  }

  /**
   * Create a new appointment (para pacientes)
   * POST /citas/paciente
   */
  async createCita(dto: CreateCitaDto): Promise<CitaResponseDto> {
    return firstValueFrom(
      this.http
        .post<CitaResponseDto>(`${this.baseUrl}/paciente`, dto)
        .pipe(catchError((error: HttpErrorResponse) => throwError(() => this.handleError(error))))
    );
  }

  /**
   * Update an existing appointment (para pacientes)
   * PUT /citas/paciente/{id}
   *
   * Restrictions:
   * - Only pending appointments can be updated
   * - Must be 72+ hours in advance
   */
  async updateCita(id: number, dto: UpdateCitaDto): Promise<CitaResponseDto> {
    return firstValueFrom(
      this.http
        .put<CitaResponseDto>(`${this.baseUrl}/paciente/${id}`, dto)
        .pipe(catchError((error: HttpErrorResponse) => throwError(() => this.handleError(error))))
    );
  }

  /**
   * Cancel an appointment (para pacientes)
   * DELETE /citas/paciente/{id}
   *
   * Restrictions:
   * - Only pending appointments can be cancelled
   * - Must be 72+ hours in advance
   */
  async cancelCita(id: number): Promise<{ message: string }> {
    return firstValueFrom(
      this.http
        .delete<{ message: string }>(`${this.baseUrl}/paciente/${id}`)
        .pipe(catchError((error: HttpErrorResponse) => throwError(() => this.handleError(error))))
    );
  }

  /**
   * Finalizar una consulta médica (para médicos)
   * POST /citas/medico/:id/finalizar
   *
   * Restricciones:
   * - Solo citas pendientes pueden ser finalizadas
   * - El médico debe estar autenticado
   * - La cita debe estar en curso o lista para atención
   */
  async finalizarConsultaMedica(id: number): Promise<{ message: string; data: CitaResponseDto }> {
    return firstValueFrom(
      this.http
        .post<{ message: string; data: CitaResponseDto }>(
          `${this.baseUrl}/medico/${id}/finalizar`,
          {}
        )
        .pipe(catchError((error: HttpErrorResponse) => throwError(() => this.handleError(error))))
    );
  }

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
