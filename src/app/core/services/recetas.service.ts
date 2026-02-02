import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { ApiError } from '../models/api.models';
import type {
  MisRecetasResponseDto,
  RecetaPacienteDto,
  RecetasPacienteResponseDto,
} from '../models/receta.models';

/**
 * Error personalizado para recetas que incluye el mensaje del backend
 */
export interface RecetasError extends Error {
  statusCode?: number;
  backendMessage?: string;
}

/**
 * Servicio para gestionar recetas médicas del paciente
 *
 * Endpoints utilizados:
 * - GET /recetas/paciente/mis-recetas - Obtener todas las recetas del paciente autenticado
 */
@Injectable({
  providedIn: 'root',
})
export class RecetasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Extrae el mensaje de error del backend de una respuesta HTTP
   */
  private handleError(error: HttpErrorResponse): never {
    let errorMessage = 'Error al cargar las recetas';
    let backendMessage: string | undefined;

    if (error.error && typeof error.error === 'object') {
      const apiError = error.error as ApiError;
      backendMessage = apiError.message;
      errorMessage = apiError.message || errorMessage;
    } else if (error.status === 0) {
      errorMessage =
        'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error.status === 401) {
      errorMessage = 'No estás autorizado para ver estas recetas.';
    } else if (error.status === 404) {
      errorMessage = backendMessage || 'No se encontraron recetas.';
    } else if (error.status >= 500) {
      errorMessage = 'Error en el servidor. Por favor, intenta más tarde.';
    }

    const customError = new Error(errorMessage) as RecetasError;
    customError.statusCode = error.status;
    customError.backendMessage = backendMessage;

    throw customError;
  }

  /**
   * Obtiene todas las recetas médicas del paciente autenticado
   *
   * Endpoint: GET /recetas/paciente/mis-recetas
   * Las recetas vienen ordenadas por fecha (más recientes primero)
   *
   * @returns Promise con la respuesta completa incluyendo total y lista de recetas
   * @throws RecetasError con el mensaje específico del backend
   */
  async getMisRecetas(): Promise<RecetasPacienteResponseDto> {
    const response = await firstValueFrom(
      this.http
        .get<MisRecetasResponseDto>(
          `${this.apiUrl}/recetas/paciente/mis-recetas`,
        )
        .pipe(
          catchError((error: HttpErrorResponse) =>
            throwError(() => this.handleError(error)),
          ),
        ),
    );

    return response.data;
  }

  /**
   * Obtiene una receta específica por ID
   * Busca en la lista de recetas del paciente
   *
   * @param recetaId - ID de la receta
   * @returns Promise con la receta encontrada o null
   */
  async getRecetaById(recetaId: number): Promise<RecetaPacienteDto | null> {
    try {
      const data = await this.getMisRecetas();
      const receta = data.recetas.find((r) => r.id === recetaId);
      return receta || null;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el conteo total de recetas del paciente
   *
   * @returns Promise con el número total de recetas
   */
  async getTotalRecetas(): Promise<number> {
    try {
      const data = await this.getMisRecetas();
      return data.totalRecetas;
    } catch {
      return 0;
    }
  }
}
