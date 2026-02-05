import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// Paciente DTOs
// ==========================================

export interface GeneroInfoDto {
  id: number;
  nombre: string;
}

export interface EstadoInfoDto {
  id: number;
  nombre: string;
}

export interface RolInfoDto {
  id: number;
  nombre: string;
}

export interface PacienteDto {
  id: number;
  cedula: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombres?: string;
  apellido?: string;
  email: string;
  verificado: boolean;
  fechaCreacion: string;
  imageUrl?: string;
  genero?: GeneroInfoDto;
  estado?: EstadoInfoDto;
  roles?: RolInfoDto[];
}

@Injectable({
  providedIn: 'root',
})
export class PacientesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  /**
   * Obtiene la lista de todos los pacientes registrados
   * GET /people/pacientes
   * Nota: La respuesta es un array directo, no tiene wrapper { message, data }
   */
  async getAllPacientes(): Promise<PacienteDto[]> {
    try {
      const url = `${this.baseUrl}/people/pacientes`;
      console.log('[PacientesService] Haciendo GET a:', url);

      const response = await firstValueFrom(this.http.get<PacienteDto[]>(url));

      console.log('[PacientesService] Respuesta completa:', response);

      return response || [];
    } catch (error) {
      console.error('[PacientesService] Error:', error);
      return [];
    }
  }

  /**
   * Obtiene un paciente por su ID
   * Nota: Usar el endpoint de perfil o info del paciente si es necesario
   */
  async getPacienteById(id: number): Promise<PacienteDto | null> {
    const pacientes = await this.getAllPacientes();
    return pacientes.find((p) => p.id === id) || null;
  }

  /**
   * Obtiene el nombre completo del paciente
   */
  getNombreCompleto(paciente: PacienteDto): string {
    const nombres = [paciente.primerNombre, paciente.segundoNombre].filter(Boolean).join(' ');
    const apellidos = [paciente.primerApellido, paciente.segundoApellido].filter(Boolean).join(' ');
    return `${nombres} ${apellidos}`.trim();
  }

  /**
   * Obtiene las iniciales del paciente
   */
  getInitials(paciente: PacienteDto): string {
    const iniciales = [paciente.primerNombre?.[0], paciente.primerApellido?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
    return iniciales;
  }

  /**
   * Verifica si el paciente tiene rol de médico
   */
  isMedico(paciente: PacienteDto): boolean {
    return (
      paciente.roles?.some(
        (rol) => rol.nombre.toUpperCase() === 'MEDICO' || rol.nombre.toUpperCase() === 'MÉDICO'
      ) || false
    );
  }

  /**
   * Formatea la fecha de creación
   */
  formatFechaCreacion(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
