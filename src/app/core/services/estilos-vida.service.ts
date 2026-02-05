import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interfaces para Estilos de Vida (del backend)
 */
export interface EstiloVidaDto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: 'HABITO' | 'DIETA' | 'EJERCICIO' | 'SUSTANCIA' | 'OTRO';
  activo: boolean;
  creadoEn: string;
}

export interface CreateEstiloVidaDto {
  nombre: string;
  descripcion: string;
  categoria: 'HABITO' | 'DIETA' | 'EJERCICIO' | 'SUSTANCIA' | 'OTRO';
}

export interface UpdateEstiloVidaDto {
  nombre?: string;
  descripcion?: string;
  categoria?: 'HABITO' | 'DIETA' | 'EJERCICIO' | 'SUSTANCIA' | 'OTRO';
  activo?: boolean;
}

// Respuesta wrapper del backend
interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class EstilosVidaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/estilos-vida';

  // Signals estado reactivo
  readonly estilos = signal<EstiloVidaDto[]>([]);
  readonly loading = signal(false);

  /**
   * Obtener todos los estilos de vida
   */
  getEstilos(): Observable<EstiloVidaDto[]> {
    return this.http
      .get<ApiResponse<EstiloVidaDto[]>>(this.apiUrl)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Obtener estilo de vida por ID
   */
  getEstiloById(id: number): Observable<EstiloVidaDto> {
    return this.http
      .get<ApiResponse<EstiloVidaDto>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Crear nuevo estilo de vida
   */
  createEstilo(data: CreateEstiloVidaDto): Observable<EstiloVidaDto> {
    return this.http
      .post<ApiResponse<EstiloVidaDto>>(this.apiUrl, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Actualizar estilo de vida
   */
  updateEstilo(id: number, data: UpdateEstiloVidaDto): Observable<EstiloVidaDto> {
    return this.http
      .put<ApiResponse<EstiloVidaDto>>(`${this.apiUrl}/${id}`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Eliminar estilo de vida
   */
  deleteEstilo(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(() => undefined));
  }

  /**
   * Alternar estado activo
   */
  toggleActivo(id: number): Observable<EstiloVidaDto> {
    return this.http
      .patch<ApiResponse<EstiloVidaDto>>(`${this.apiUrl}/${id}/toggle`, {})
      .pipe(map((response) => response.data));
  }

  /**
   * Obtener categorías disponibles
   */
  getCategorias(): { value: string; label: string; color: string }[] {
    return [
      { value: 'HABITO', label: 'Hábito', color: 'bg-slate-100 text-slate-700' },
      { value: 'DIETA', label: 'Dieta', color: 'bg-green-100 text-green-700' },
      { value: 'EJERCICIO', label: 'Ejercicio', color: 'bg-blue-100 text-blue-700' },
      { value: 'SUSTANCIA', label: 'Sustancia', color: 'bg-amber-100 text-amber-700' },
      { value: 'OTRO', label: 'Otro', color: 'bg-purple-100 text-purple-700' },
    ];
  }

  /**
   * Obtener clase CSS para categoría
   */
  getCategoriaClass(categoria: string): string {
    const cats = this.getCategorias();
    return cats.find((c) => c.value === categoria)?.color || 'bg-slate-100 text-slate-700';
  }

  /**
   * Obtener label para categoría
   */
  getCategoriaLabel(categoria: string): string {
    const cats = this.getCategorias();
    return cats.find((c) => c.value === categoria)?.label || categoria;
  }

  /**
   * Formatear fecha
   */
  formatFecha(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
