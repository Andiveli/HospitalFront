import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { BackendConsultasResponseDto, ConsultaMedicaDto } from '../models';

/**
 * Servicio para gestionar consultas médicas del médico
 *
 * Endpoints:
 * - GET /medicos/consultas - Listar consultas asignadas
 * - GET /medicos/consultas/:id - Detalle de consulta
 * - POST /medicos/consultas/:id/atender - Iniciar atención virtual
 */
@Injectable({
  providedIn: 'root',
})
export class MedicoProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/medicos`;

  /**
   * Obtener la lista de consultas asignadas al médico
   * GET /medicos/consultas
   */
  async getConsultas(filters?: {
    estado?: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<ConsultaMedicaDto[]> {
    const params: Record<string, string> = {};

    if (filters?.estado) {
      params['estado'] = filters.estado;
    }
    if (filters?.fechaDesde) {
      params['fechaDesde'] = filters.fechaDesde;
    }
    if (filters?.fechaHasta) {
      params['fechaHasta'] = filters.fechaHasta;
    }

    const response = await firstValueFrom(
      this.http.get<BackendConsultasResponseDto>(`${this.baseUrl}/consultas`, { params })
    );
    return response.data;
  }

  /**
   * Obtener detalle de una consulta específica
   * GET /medicos/consultas/:id
   */
  async getConsultaById(consultaId: number): Promise<ConsultaMedicaDto> {
    const response = await firstValueFrom(
      this.http.get<{ message: string; data: ConsultaMedicaDto }>(
        `${this.baseUrl}/consultas/${consultaId}`
      )
    );
    return response.data;
  }

  /**
   * Iniciar atención de una consulta virtual
   * POST /medicos/consultas/:id/atender
   */
  async iniciarAtencion(consultaId: number): Promise<{ roomUrl: string; token: string }> {
    const response = await firstValueFrom(
      this.http.post<{ message: string; data: { roomUrl: string; token: string } }>(
        `${this.baseUrl}/consultas/${consultaId}/atender`,
        {}
      )
    );
    return response.data;
  }

  /**
   * Completar una consulta y guardar notas médicas
   * POST /medicos/consultas/:id/completar
   */
  async completarConsulta(consultaId: number, notasMedicas: string): Promise<ConsultaMedicaDto> {
    const response = await firstValueFrom(
      this.http.post<{ message: string; data: ConsultaMedicaDto }>(
        `${this.baseUrl}/consultas/${consultaId}/completar`,
        { notasMedicas }
      )
    );
    return response.data;
  }
}
