import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// Medicamentos DTOs
// ==========================================

export interface PresentacionDto {
  id: number;
  nombre: string;
}

export interface MedicamentoDto {
  id: number;
  nombre: string;
  principioActivo: string;
  concentracion?: string;
  presentacion: PresentacionDto;
}

export interface CreateMedicamentoDto {
  nombre: string;
  principioActivo: string;
  concentracion?: string;
  presentacionId: number;
}

export interface UpdateMedicamentoDto {
  nombre?: string;
  principioActivo?: string;
  concentracion?: string;
  presentacionId?: number;
}

export interface MedicamentosListResponseDto {
  message: string;
  data: MedicamentoDto[];
}

export interface MedicamentoResponseDto {
  message: string;
  data: MedicamentoDto;
}

export interface PresentacionesListResponseDto {
  message: string;
  data: PresentacionDto[];
}

export interface CreatePresentacionDto {
  nombre: string;
}

export interface PresentacionResponseDto {
  message: string;
  data: PresentacionDto;
}

@Injectable({
  providedIn: 'root',
})
export class MedicamentosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/medicamentos`;

  /**
   * Obtiene la lista completa de medicamentos
   * GET /medicamentos
   */
  async getAllMedicamentos(): Promise<MedicamentoDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<MedicamentosListResponseDto>(this.baseUrl)
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching medicamentos:', error);
      return [];
    }
  }

  /**
   * Obtiene un medicamento por su ID
   * GET /medicamentos/{id}
   */
  async getMedicamentoById(id: number): Promise<MedicamentoDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<MedicamentoResponseDto>(`${this.baseUrl}/${id}`)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching medicamento:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo medicamento
   * POST /medicamentos
   */
  async createMedicamento(data: CreateMedicamentoDto): Promise<MedicamentoDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.post<MedicamentoResponseDto>(this.baseUrl, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error creating medicamento:', error);
      throw error;
    }
  }

  /**
   * Actualiza un medicamento existente
   * PUT /medicamentos/{id}
   */
  async updateMedicamento(id: number, data: UpdateMedicamentoDto): Promise<MedicamentoDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.put<MedicamentoResponseDto>(`${this.baseUrl}/${id}`, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error updating medicamento:', error);
      throw error;
    }
  }

  /**
   * Elimina un medicamento
   * DELETE /medicamentos/{id}
   */
  async deleteMedicamento(id: number): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
      return true;
    } catch (error) {
      console.error('Error deleting medicamento:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las presentaciones disponibles
   * GET /medicamentos/presentaciones
   */
  async getAllPresentaciones(): Promise<PresentacionDto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<PresentacionesListResponseDto>(`${this.baseUrl}/presentaciones`)
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching presentaciones:', error);
      return [];
    }
  }

  /**
   * Crea una nueva presentación
   * POST /medicamentos/presentaciones
   */
  async createPresentacion(data: CreatePresentacionDto): Promise<PresentacionDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.post<PresentacionResponseDto>(`${this.baseUrl}/presentaciones`, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error creating presentacion:', error);
      throw error;
    }
  }

  /**
   * Obtiene una presentación por su ID
   * GET /medicamentos/presentaciones/{id}
   */
  async getPresentacionById(id: number): Promise<PresentacionDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<PresentacionResponseDto>(`${this.baseUrl}/presentaciones/${id}`)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching presentacion:', error);
      return null;
    }
  }

  /**
   * Actualiza una presentación existente
   * PUT /medicamentos/presentaciones/{id}
   */
  async updatePresentacion(
    id: number,
    data: CreatePresentacionDto
  ): Promise<PresentacionDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.put<PresentacionResponseDto>(`${this.baseUrl}/presentaciones/${id}`, data)
      );
      return response.data || null;
    } catch (error) {
      console.error('Error updating presentacion:', error);
      throw error;
    }
  }

  /**
   * Elimina una presentación
   * DELETE /medicamentos/presentaciones/{id}
   */
  async deletePresentacion(id: number): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/presentaciones/${id}`));
      return true;
    } catch (error) {
      console.error('Error deleting presentacion:', error);
      return false;
    }
  }

  /**
   * Formatea la información del medicamento para mostrar
   */
  formatMedicamentoInfo(medicamento: MedicamentoDto): string {
    const concentracion = medicamento.concentracion ? ` ${medicamento.concentracion}` : '';
    return `${medicamento.nombre}${concentracion} (${medicamento.presentacion.nombre})`;
  }

  /**
   * Obtiene las iniciales del nombre del medicamento
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
