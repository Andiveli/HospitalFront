import { Component, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../../core/services/citas.service';
import { CitaResponseDto, formatMedicoNombreSimplificado } from '../../../core/models';

@Component({
  selector: 'app-lista-citas',
  imports: [CommonModule],
  templateUrl: './lista-citas.component.html',
  styleUrl: './lista-citas.component.scss',
})
export default class ListaCitasComponent {
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);

  // =====================================
  // STATE - Proximas Citas (Next 3)
  // =====================================
  proximasCitas = signal<CitaResponseDto[]>([]);
  loadingProximas = signal(false);

  // =====================================
  // STATE - Historial (Last 4)
  // =====================================
  historialCitas = signal<CitaResponseDto[]>([]);
  loadingHistorial = signal(false);

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    this.loadProximasCitas();
    this.loadHistorialCitas();
  }

  // =====================================
  // METHODS - Load Data
  // =====================================
  async loadProximasCitas(): Promise<void> {
    this.loadingProximas.set(true);
    try {
      const citas = await this.citasService.getProximasCitas();
      this.proximasCitas.set(citas);
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    } finally {
      this.loadingProximas.set(false);
    }
  }

  async loadHistorialCitas(): Promise<void> {
    this.loadingHistorial.set(true);
    try {
      const citas = await this.citasService.getRecientesCitas();
      this.historialCitas.set(citas);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      this.loadingHistorial.set(false);
    }
  }

  // =====================================
  // METHODS - Navigation
  // =====================================
  agendarNuevaCita(): void {
    this.router.navigate(['/citas/agendar']);
  }

  verDetalle(citaId: number): void {
    this.router.navigate(['/citas', citaId]);
  }

  verTodasPendientes(): void {
    this.router.navigate(['/citas/pendientes']);
  }

  verTodasAtendidas(): void {
    this.router.navigate(['/citas/atendidas']);
  }

  // =====================================
  // HELPER METHODS
  // =====================================
  getMedicoNombre(cita: CitaResponseDto): string {
    return formatMedicoNombreSimplificado(cita.medico);
  }

  getEspecialidad(cita: CitaResponseDto): string {
    return cita.medico.especialidad || 'General';
  }

  formatDateShort(isoDate: string): { day: string; month: string } {
    const date = new Date(isoDate);
    const day = date.getDate().toString();
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const month = months[date.getMonth()];
    return { day, month };
  }

  formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  formatDateLong(isoDate: string): string {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('es-EC', options);
  }

  formatDateTime(isoDate: string): string {
    const dateLong = this.formatDateLong(isoDate);
    const time = this.formatTime(isoDate);
    return `${dateLong} - ${time}H`;
  }

  canModify(cita: CitaResponseDto): boolean {
    return this.citasService.canModifyCita(cita.fechaHoraInicio);
  }
}
