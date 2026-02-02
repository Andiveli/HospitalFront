import {
  HttpClient,
  type HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { ApiError, ApiResponse } from '../models/api.models';
import type {
  DocumentFilterType,
  DocumentResponseDto,
  TipoDocumento,
} from '../models/document.models';
import { DOCUMENT_FILTER_TYPES } from '../models/document.models';

/**
 * Error personalizado para documentos que incluye el mensaje del backend
 */
export interface DocumentsError extends Error {
  statusCode?: number;
  backendMessage?: string;
}

/**
 * Servicio para gestionar documentos médicos del paciente
 *
 * Endpoints utilizados:
 * - GET /documents/historia - Obtener documentos del paciente (con filtro opcional ?tipo=)
 * - GET /documents/tipos - Obtener tipos de documento disponibles
 * - GET /documents/:id/download - Descargar documento (redirect a S3)
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Extrae el mensaje de error del backend de una respuesta HTTP
   */
  private handleError(error: HttpErrorResponse): never {
    let errorMessage = 'Error al cargar los documentos';
    let backendMessage: string | undefined;

    if (error.error && typeof error.error === 'object') {
      // El backend devuelve { message: string, statusCode: number, error: string }
      const apiError = error.error as ApiError;
      backendMessage = apiError.message;
      errorMessage = apiError.message || errorMessage;
    } else if (error.status === 0) {
      errorMessage =
        'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error.status === 401) {
      errorMessage = 'No estás autorizado para ver estos documentos.';
    } else if (error.status === 404) {
      // Mensajes específicos según el contexto
      errorMessage = backendMessage || 'No se encontraron documentos.';
    } else if (error.status >= 500) {
      errorMessage = 'Error en el servidor. Por favor, intenta más tarde.';
    }

    const customError = new Error(errorMessage) as DocumentsError;
    customError.statusCode = error.status;
    customError.backendMessage = backendMessage;

    throw customError;
  }

  /**
   * Obtiene los documentos de la historia clínica del paciente
   *
   * @param tipo - Tipo de documento para filtrar (opcional)
   * @returns Promise con el array de documentos
   * @throws DocumentsError con el mensaje específico del backend
   */
  async getDocumentsByHistoria(
    tipo?: DocumentFilterType,
  ): Promise<DocumentResponseDto[]> {
    let params = new HttpParams();

    if (tipo && tipo !== DOCUMENT_FILTER_TYPES.ALL) {
      params = params.set('tipo', tipo);
    }

    const response = await firstValueFrom(
      this.http
        .get<
          ApiResponse<DocumentResponseDto[]>
        >(`${this.apiUrl}/documents/historia`, { params })
        .pipe(
          catchError((error: HttpErrorResponse) =>
            throwError(() => this.handleError(error)),
          ),
        ),
    );

    return response.data;
  }

  /**
   * Obtiene todos los documentos sin filtrar
   * Alias de getDocumentsByHistoria sin parámetros
   */
  async getAllDocuments(): Promise<DocumentResponseDto[]> {
    return this.getDocumentsByHistoria();
  }

  /**
   * Obtiene los tipos de documento disponibles para filtrado
   *
   * Endpoint: GET /documents/tipos
   */
  async getDocumentTypes(): Promise<TipoDocumento[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<TipoDocumento[]>>(
          `${this.apiUrl}/documents/tipos`,
        ),
      );
      return response.data;
    } catch {
      console.warn('Endpoint /documents/tipos no disponible');
      return [];
    }
  }

  /**
   * Genera la URL de descarga para un documento
   *
   * El backend redirige (302) a una URL firmada de S3
   *
   * @param documentId - ID del documento
   * @param forceDownload - Si es true, fuerza la descarga en lugar de preview
   * @returns URL completa para descargar el documento
   */
  getDownloadUrl(documentId: number, forceDownload = false): string {
    let url = `${this.apiUrl}/documents/${documentId}/download`;
    if (forceDownload) {
      url += '?force=true';
    }
    return url;
  }

  /**
   * Abre el documento en una nueva pestaña para visualización
   *
   * @param documentId - ID del documento
   */
  previewDocument(documentId: number): void {
    const url = this.getDownloadUrl(documentId, false);
    window.open(url, '_blank');
  }

  /**
   * Inicia la descarga del documento
   *
   * @param documentId - ID del documento
   * @param filename - Nombre sugerido para el archivo
   */
  downloadDocument(documentId: number, filename?: string): void {
    const url = this.getDownloadUrl(documentId, true);

    const link = document.createElement('a');
    link.href = url;

    if (filename) {
      link.download = filename;
    }

    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
