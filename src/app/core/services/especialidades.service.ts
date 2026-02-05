import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { EspecialidadDto, PaginatedResponse, PaginationParams } from '../models';

// ==========================================
// Especialidades DTOs
// ==========================================

export interface CreateEspecialidadDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateEspecialidadDto {
  nombre?: string;
  descripcion?: string;
}

export interface EspecialidadesListResponseDto {
  message: string;
  data: EspecialidadDto[];
}

export interface EspecialidadResponseDto {
  message: string;
  data: EspecialidadDto;
}

@Injectable({
  providedIn: 'root',
})
export class EspecialidadesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/especialidades`;

  /**
   * Get list of medical specialties (paginated)
   * GET /especialidades?page=1&limit=50
   */
  async getEspecialidades(
    params: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<EspecialidadDto>> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    return firstValueFrom(
      this.http.get<PaginatedResponse<EspecialidadDto>>(this.baseUrl, {
        params: httpParams,
      })
    );
  }

  /**
   * Get all specialties (unpaginated - fetches all pages)
   */
  async getAllEspecialidades(): Promise<EspecialidadDto[]> {
    const firstPage = await this.getEspecialidades({ page: 1, limit: 100 });

    if (firstPage.meta.totalPages > 1) {
      const promises: Promise<PaginatedResponse<EspecialidadDto>>[] = [];

      for (let i = 2; i <= firstPage.meta.totalPages; i++) {
        promises.push(this.getEspecialidades({ page: i, limit: 100 }));
      }

      const results = await Promise.all(promises);
      const allData = [...firstPage.data, ...results.flatMap((r) => r.data)];

      return allData;
    }

    return firstPage.data;
  }

  /**
   * Obtiene una especialidad por su ID
   * GET /especialidades/{id}
   */
  async getEspecialidadById(id: number): Promise<EspecialidadDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<EspecialidadResponseDto>(`${this.baseUrl}/${id}`)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching especialidad:', error);
      return null;
    }
  }

  /**
   * Crea una nueva especialidad
   * POST /especialidades
   */
  async createEspecialidad(data: CreateEspecialidadDto): Promise<EspecialidadDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.post<EspecialidadResponseDto>(this.baseUrl, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error creating especialidad:', error);
      throw error;
    }
  }

  /**
   * Actualiza una especialidad existente
   * PUT /especialidades/{id}
   */
  async updateEspecialidad(
    id: number,
    data: UpdateEspecialidadDto
  ): Promise<EspecialidadDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.put<EspecialidadResponseDto>(`${this.baseUrl}/${id}`, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error updating especialidad:', error);
      throw error;
    }
  }

  /**
   * Elimina una especialidad
   * DELETE /especialidades/{id}
   */
  async deleteEspecialidad(id: number): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
      return true;
    } catch (error) {
      console.error('Error deleting especialidad:', error);
      return false;
    }
  }

  /**
   * Obtiene las iniciales del nombre de la especialidad
   */
  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
