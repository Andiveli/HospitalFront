import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CompletarPerfilDto {
  estiloVida: string;
  fecha: string;
  pais: string;
  residencia: string;
  sangre: string;
  telefono: string;
}

export interface PaisDto {
  id: number;
  nombre: string;
}

export interface GrupoSanguineoDto {
  id: number;
  nombre: string;
}

export interface EstiloVidaDto {
  id: number;
  nombre: string;
}

// Respuesta wrapper del backend
interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class CompletarPerfilService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  /**
   * Envía los datos adicionales del paciente
   * POST /pacientes/addInfo
   */
  addInfo(data: CompletarPerfilDto): Observable<CompletarPerfilDto> {
    return this.http
      .post<ApiResponse<CompletarPerfilDto>>(`${this.apiUrl}/pacientes/addInfo`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Actualiza la información del paciente
   * PUT /pacientes/updateInfo
   */
  updateInfo(data: CompletarPerfilDto): Observable<CompletarPerfilDto> {
    return this.http
      .put<ApiResponse<CompletarPerfilDto>>(`${this.apiUrl}/pacientes/updateInfo`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene la lista de países
   * GET /paises
   */
  getPaises(): Observable<PaisDto[]> {
    return this.http.get<ApiResponse<PaisDto[]>>(`${this.apiUrl}/paises`).pipe(
      map((response) => response.data || []),
      catchError(() => of(this.getPaisesFallback()))
    );
  }

  /**
   * Obtiene la lista de grupos sanguíneos
   * GET /grupos-sanguineos
   */
  getGruposSanguineos(): Observable<GrupoSanguineoDto[]> {
    return this.http.get<ApiResponse<GrupoSanguineoDto[]>>(`${this.apiUrl}/grupos-sanguineos`).pipe(
      map((response) => response.data || []),
      catchError(() => of(this.getGruposSanguineosFallback()))
    );
  }

  /**
   * Obtiene la lista de estilos de vida
   * GET /estilos-vida
   */
  getEstilosVida(): Observable<EstiloVidaDto[]> {
    return this.http.get<ApiResponse<EstiloVidaDto[]>>(`${this.apiUrl}/estilos-vida`).pipe(
      map((response) => response.data || []),
      catchError(() => of(this.getEstilosVidaFallback()))
    );
  }

  // === FALLBACK DATA ===

  private getPaisesFallback(): PaisDto[] {
    return [
      { id: 1, nombre: 'Argentina' },
      { id: 2, nombre: 'Bolivia' },
      { id: 3, nombre: 'Chile' },
      { id: 4, nombre: 'Colombia' },
      { id: 5, nombre: 'Costa Rica' },
      { id: 6, nombre: 'Cuba' },
      { id: 7, nombre: 'Ecuador' },
      { id: 8, nombre: 'El Salvador' },
      { id: 9, nombre: 'Guatemala' },
      { id: 10, nombre: 'Honduras' },
      { id: 11, nombre: 'México' },
      { id: 12, nombre: 'Nicaragua' },
      { id: 13, nombre: 'Panamá' },
      { id: 14, nombre: 'Paraguay' },
      { id: 15, nombre: 'Perú' },
      { id: 16, nombre: 'Puerto Rico' },
      { id: 17, nombre: 'República Dominicana' },
      { id: 18, nombre: 'Uruguay' },
      { id: 19, nombre: 'Venezuela' },
      { id: 20, nombre: 'Otro' },
    ];
  }

  private getGruposSanguineosFallback(): GrupoSanguineoDto[] {
    return [
      { id: 1, nombre: 'A+' },
      { id: 2, nombre: 'A-' },
      { id: 3, nombre: 'B+' },
      { id: 4, nombre: 'B-' },
      { id: 5, nombre: 'AB+' },
      { id: 6, nombre: 'AB-' },
      { id: 7, nombre: 'O+' },
      { id: 8, nombre: 'O-' },
    ];
  }

  private getEstilosVidaFallback(): EstiloVidaDto[] {
    return [
      { id: 1, nombre: 'Sedentario' },
      { id: 2, nombre: 'Activo' },
      { id: 3, nombre: 'Moderado' },
      { id: 4, nombre: 'Deportista' },
    ];
  }
}
