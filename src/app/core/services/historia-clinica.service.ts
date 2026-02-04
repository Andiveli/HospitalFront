import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HistoriaClinicaResponseDto } from '../models';

/**
 * Servicio para gestionar historias clínicas
 *
 * Nuevos endpoints:
 * - GET /historia-clinica/mi-historia (Paciente - obtiene su propia historia)
 * - GET /historia-clinica/paciente/:pacienteId (Médico - obtiene historia de cualquier paciente)
 * - GET /historia-clinica/:pacienteId (Flexible - pacientes solo la suya, médicos cualquiera)
 *
 * Permite a pacientes ver su propia historia y a médicos ver
 * historias de pacientes que hayan atendido.
 */
@Injectable({
  providedIn: 'root',
})
export class HistoriaClinicaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/historia-clinica`;

  /**
   * Obtiene la historia clínica del paciente autenticado
   * Endpoint: GET /historia-clinica/mi-historia
   * Rol requerido: Paciente
   *
   * @returns Historia clínica completa del paciente autenticado
   * @throws 401 si no está autenticado
   * @throws 403 si no tiene rol de paciente
   * @throws 404 si no tiene historia clínica
   */
  async getMiHistoriaClinica(): Promise<HistoriaClinicaResponseDto> {
    const response = await firstValueFrom(
      this.http.get<{
        message: string;
        data: HistoriaClinicaResponseDto;
      }>(`${this.baseUrl}/mi-historia`)
    );
    return response.data;
  }

  /**
   * Obtiene la historia clínica de un paciente específico (para médicos)
   * Endpoint: GET /historia-clinica/paciente/:pacienteId
   * Rol requerido: Médico
   *
   * @param pacienteId ID del paciente
   * @returns Historia clínica completa del paciente
   * @throws 401 si no está autenticado
   * @throws 403 si no tiene rol de médico
   * @throws 404 si el paciente no existe o no tiene historia clínica
   */
  async getHistoriaClinicaByPacienteId(pacienteId: number): Promise<HistoriaClinicaResponseDto> {
    const response = await firstValueFrom(
      this.http.get<{
        message: string;
        data: HistoriaClinicaResponseDto;
      }>(`${this.baseUrl}/paciente/${pacienteId}`)
    );
    return response.data;
  }

  /**
   * Obtiene la historia clínica de un paciente (endpoint flexible)
   * Endpoint: GET /historia-clinica/:pacienteId
   * Roles: Paciente (solo suya) / Médico (cualquiera)
   *
   * @param pacienteId ID del paciente
   * @returns Historia clínica completa con enfermedades, citas, documentos y resumen
   * @throws 403 si no tiene permisos (paciente solo ve la suya, médico cualquiera)
   * @throws 404 si el paciente no existe o no tiene historia clínica
   */
  async getHistoriaClinica(pacienteId: number): Promise<HistoriaClinicaResponseDto> {
    const response = await firstValueFrom(
      this.http.get<{
        message: string;
        data: HistoriaClinicaResponseDto;
      }>(`${this.baseUrl}/${pacienteId}`)
    );
    return response.data;
  }

  /**
   * Calcula la edad del paciente a partir de su fecha de nacimiento
   */
  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Formatea fecha para mostrar (DD/MM/YYYY)
   */
  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formatea fecha con hora
   */
  formatFechaHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Obtiene el icono según el tipo de documento
   */
  getDocumentIcon(tipo: string): string {
    const icons: Record<string, string> = {
      Laboratorio: '🔬',
      Imagen: '📷',
      Informe: '📄',
      Receta: '💊',
      Otro: '📎',
    };
    return icons[tipo] || '📄';
  }
}
