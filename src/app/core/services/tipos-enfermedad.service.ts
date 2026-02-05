import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// Tipos de Enfermedad DTOs
// ==========================================

export interface TipoEnfermedadDto {
  id: number;
  nombre: string;
}

export interface CreateTipoEnfermedadDto {
  nombre: string;
}

export interface UpdateTipoEnfermedadDto {
  nombre?: string;
}

export interface TiposEnfermedadListResponseDto {
  message: string;
  data: TipoEnfermedadDto[];
}

export interface TipoEnfermedadResponseDto {
  message: string;
  data: TipoEnfermedadDto;
}

@Injectable({
  providedIn: 'root',
})
export class TiposEnfermedadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tipo-enfermedad`;

  /**
   * Obtiene todos los tipos de enfermedad
   * GET /tipo-enfermedad
   */
  async getAllTipos(): Promise<TipoEnfermedadDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<TiposEnfermedadListResponseDto>(this.baseUrl)
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tipos enfermedad:', error);
      return [];
    }
  }

  /**
   * Obtiene un tipo de enfermedad por ID
   * GET /tipo-enfermedad/{id}
   */
  async getTipoById(id: number): Promise<TipoEnfermedadDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<TipoEnfermedadResponseDto>(`${this.baseUrl}/${id}`)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching tipo enfermedad:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo tipo de enfermedad
   * POST /tipo-enfermedad
   */
  async createTipo(data: CreateTipoEnfermedadDto): Promise<TipoEnfermedadDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.post<TipoEnfermedadResponseDto>(this.baseUrl, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error creating tipo enfermedad:', error);
      throw error;
    }
  }

  /**
   * Actualiza un tipo de enfermedad
   * PATCH /tipo-enfermedad/{id}
   */
  async updateTipo(id: number, data: UpdateTipoEnfermedadDto): Promise<TipoEnfermedadDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.patch<TipoEnfermedadResponseDto>(`${this.baseUrl}/${id}`, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error updating tipo enfermedad:', error);
      throw error;
    }
  }

  /**
   * Obtiene las iniciales del nombre
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
