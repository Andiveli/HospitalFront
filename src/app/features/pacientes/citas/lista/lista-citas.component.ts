import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { type CitaResponseDto, formatMedicoNombreSimplificado } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { CitasService } from '../../../../core/services/citas.service';
import { VideoCallService } from '../../../../core/services/video-call.service';
import {
  getTimeUntilReady,
  hasAppointmentExpired,
  isAppointmentTimeReady,
} from '../../../../core/utils/appointment-time.utils';

@Component({
  selector: 'app-lista-citas',
  imports: [CommonModule],
  templateUrl: './lista-citas.component.html',
  styleUrl: './lista-citas.component.scss',
})
export default class ListaCitasComponent {
  private readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);
  private readonly videoCallService = inject(VideoCallService);
  private readonly router = inject(Router);

  // =====================================
  // STATE - Proximas Citas (Next 3)
  // =====================================
  proximasCitas = signal<CitaResponseDto[]>([]);
  loadingProximas = signal(false);

  // =====================================
  // STATE - All Pending Citas (Paginated)
  // =====================================
  todasPendientes = signal<CitaResponseDto[]>([]);
  loadingTodasPendientes = signal(false);
  showAllPendientes = signal(false);
  currentPagePendientes = signal(1);
  totalPagesPendientes = signal(1);
  totalPendientes = signal(0);
  vistaGridPendientes = signal(true); // true = grid, false = list

  // =====================================
  // STATE - Historial (Last 4)
  // =====================================
  historialCitas = signal<CitaResponseDto[]>([]);
  loadingHistorial = signal(false);

  // =====================================
  // STATE - All Atendidas (Paginated)
  // =====================================
  todasAtendidas = signal<CitaResponseDto[]>([]);
  loadingTodasAtendidas = signal(false);
  showAllAtendidas = signal(false);
  currentPageAtendidas = signal(1);
  totalPagesAtendidas = signal(1);
  totalAtendidas = signal(0);

  private readonly PAGE_LIMIT = 10;

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Recargar citas cuando cambia el usuario (para evitar caché al cambiar de cuenta)
    effect(() => {
      const user = this.authService.user();
      if (user) {
        // Usuario autenticado - cargar sus citas
        this.loadProximasCitas();
        this.loadHistorialCitas();
      } else {
        // No hay usuario (logout) - limpiar datos
        this.proximasCitas.set([]);
        this.historialCitas.set([]);
        this.todasPendientes.set([]);
        this.todasAtendidas.set([]);
      }
    });
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

  async loadTodasPendientes(page: number = 1): Promise<void> {
    this.loadingTodasPendientes.set(true);
    try {
      const response = await this.citasService.getPendientesCitas({
        page,
        limit: this.PAGE_LIMIT,
      });
      this.todasPendientes.set(response.data);
      this.currentPagePendientes.set(response.meta.page);
      this.totalPagesPendientes.set(response.meta.totalPages);
      this.totalPendientes.set(response.meta.total);
    } catch (error) {
      console.error('Error loading all pending appointments:', error);
    } finally {
      this.loadingTodasPendientes.set(false);
    }
  }

  async loadTodasAtendidas(page: number = 1): Promise<void> {
    this.loadingTodasAtendidas.set(true);
    try {
      const response = await this.citasService.getAtendidasCitas({
        page,
        limit: this.PAGE_LIMIT,
      });
      this.todasAtendidas.set(response.data);
      this.currentPageAtendidas.set(response.meta.page);
      this.totalPagesAtendidas.set(response.meta.totalPages);
      this.totalAtendidas.set(response.meta.total);
    } catch (error) {
      console.error('Error loading all attended appointments:', error);
    } finally {
      this.loadingTodasAtendidas.set(false);
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

  // =====================================
  // METHODS - Toggle Views
  // =====================================
  toggleVerTodasPendientes(): void {
    if (this.showAllPendientes()) {
      this.showAllPendientes.set(false);
    } else {
      this.showAllPendientes.set(true);
      this.loadTodasPendientes(1);
    }
  }

  toggleVerTodasAtendidas(): void {
    if (this.showAllAtendidas()) {
      this.showAllAtendidas.set(false);
    } else {
      this.showAllAtendidas.set(true);
      this.loadTodasAtendidas(1);
    }
  }

  // =====================================
  // METHODS - Pagination
  // =====================================
  goToPagePendientes(page: number): void {
    if (page >= 1 && page <= this.totalPagesPendientes()) {
      this.loadTodasPendientes(page);
    }
  }

  goToPageAtendidas(page: number): void {
    if (page >= 1 && page <= this.totalPagesAtendidas()) {
      this.loadTodasAtendidas(page);
    }
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

  // Helper para paginación
  getStartIndex(currentPage: number): number {
    return (currentPage - 1) * this.PAGE_LIMIT + 1;
  }

  getEndIndex(currentPage: number, total: number): number {
    return Math.min(currentPage * this.PAGE_LIMIT, total);
  }

  // Generar array de números para paginación (solo páginas visibles)
  getVisiblePages(currentPage: number, totalPages: number): number[] {
    const delta = 2; // Show 2 pages on each side of current page
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1);
    } else {
      rangeWithDots.push(1);
    }

    range.forEach((i) => {
      rangeWithDots.push(i);
    });

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push(totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Remove duplicates and sort
    return [...new Set(rangeWithDots)].sort((a, b) => a - b);
  }

  // Legacy method for backwards compatibility
  getPageNumbers(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  formatDateShort(isoDate: string): { day: string; month: string } {
    const date = new Date(isoDate);
    const day = date.getDate().toString();
    const months = [
      'ENE',
      'FEB',
      'MAR',
      'ABR',
      'MAY',
      'JUN',
      'JUL',
      'AGO',
      'SEP',
      'OCT',
      'NOV',
      'DIC',
    ];
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

  // =====================================
  // METHODS - Video Call Room
  // =====================================
  isIngresarSalaReady(cita: CitaResponseDto): boolean {
    // Solo para citas telefónicas (videollamadas)
    if (!cita.telefonica) return false;

    // Verificar si está en el horario (5 minutos antes)
    return isAppointmentTimeReady(cita.fechaHoraInicio);
  }

  hasSalaExpired(cita: CitaResponseDto): boolean {
    // Solo para citas telefónicas (videollamadas)
    if (!cita.telefonica) return false;

    // Verificar si la cita ya expiró
    return hasAppointmentExpired(cita.fechaHoraInicio, cita.fechaHoraFin);
  }

  getTimeUntilSalaReady(cita: CitaResponseDto): string {
    // Solo para citas telefónicas (videollamadas)
    if (!cita.telefonica) return '';

    return getTimeUntilReady(cita.fechaHoraInicio);
  }

  ingresarASala(citaId: number): void {
    // Navegar a la sala de espera del paciente
    this.router.navigate(['/sala-espera', citaId]);
  }

  async generarLinkInvitado(citaId: number): Promise<void> {
    try {
      const guestData = {
        nombreInvitado: 'Invitado',
        rolInvitado: 'invitado' as const,
      };

      const response = await this.videoCallService.createInvitation(citaId, guestData);

      // Use linkInvitacion if available, otherwise construct from codigoAcceso
      const url =
        response.linkInvitacion || `${window.location.origin}/invitado/${response.codigoAcceso}`;

      // Copiar al portapapeles
      await navigator.clipboard.writeText(url);
      alert('Link de invitado copiado al portapapeles: ' + url);
    } catch (error: unknown) {
      console.error('Error generating guest link:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error al generar link de invitado';
      alert(errorMessage);
    }
  }
}
