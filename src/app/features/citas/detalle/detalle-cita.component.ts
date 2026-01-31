import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  type CitaDetalladaResponseDto,
  formatMedicoNombreSimplificado,
} from '../../../core/models';
import type { GenerarInvitacionDto } from '../../../core/models/video-call.models';
import { CitasService } from '../../../core/services/citas.service';
import { VideoCallService } from '../../../core/services/video-call.service';
import {
  getTimeUntilReady,
  hasAppointmentExpired,
  isAppointmentTimeReady,
} from '../../../core/utils/appointment-time.utils';
import EditCitaModalComponent from '../../../shared/components/edit-cita-modal/edit-cita-modal.component';

@Component({
  selector: 'app-detalle-cita',
  imports: [CommonModule, EditCitaModalComponent],
  templateUrl: './detalle-cita.component.html',
  styleUrl: './detalle-cita.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DetalleCitaComponent {
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);
  private readonly videoCallService = inject(VideoCallService);

  // Route param (id) - optional because it's loaded async
  id = input<string>();

  // Check if we're in the medico route by checking the current URL
  isMedicoRoute(): boolean {
    return this.router.url.includes('/citas/medico');
  }

  // Modal reference
  editModal = viewChild<EditCitaModalComponent>('editModal');

  // =====================================
  // STATE
  // =====================================
  cita = signal<CitaDetalladaResponseDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // UI State
  showCancelConfirm = signal(false);
  successMessage = signal<string | null>(null);

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Load cita when id changes (using effect to wait for input to be available)
    effect(() => {
      const citaId = this.id();
      if (citaId) {
        this.loadCitaDetalle();
      }
    });
  }

  // =====================================
  // METHODS - Load Data
  // =====================================
  async loadCitaDetalle(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const citaIdStr = this.id();
      if (!citaIdStr) {
        throw new Error('ID de cita no disponible');
      }

      const citaId = parseInt(citaIdStr, 10);
      if (isNaN(citaId)) {
        throw new Error('ID de cita inválido');
      }

      // Use medico endpoint if we're in the medico route, otherwise patient endpoint
      const cita = this.isMedicoRoute()
        ? await this.citasService.getCitaDetalleMedico(citaId)
        : await this.citasService.getCitaDetalle(citaId);
      this.cita.set(cita);
    } catch (error: any) {
      console.error('Error loading appointment details:', error);
      this.error.set(error?.error?.message || 'Error al cargar los detalles de la cita.');
    } finally {
      this.loading.set(false);
    }
  }

  // =====================================
  // METHODS - Navigation
  // =====================================
  goBack(): void {
    this.router.navigate(['/citas']);
  }

  // =====================================
  // HELPER METHODS
  // =====================================
  getMedicoNombre(): string {
    const citaData = this.cita();
    return citaData ? formatMedicoNombreSimplificado(citaData.medico) : '';
  }

  getEspecialidad(): string {
    const citaData = this.cita();
    return citaData ? citaData.medico.especialidad : '';
  }

  getEstado(): string {
    const citaData = this.cita();
    return citaData ? citaData.estado : 'pendiente';
  }

  isPendiente(): boolean {
    return this.getEstado().toLowerCase() === 'pendiente';
  }

  isAtendida(): boolean {
    return this.getEstado().toLowerCase() === 'atendida';
  }

  formatDateTime(isoDate: string): string {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const dateStr = date.toLocaleDateString('es-EC', options);
    const timeStr = date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateStr} - ${timeStr}H`;
  }

  hasDiagnostico(): boolean {
    return !!this.cita()?.diagnostico;
  }

  hasRecetas(): boolean {
    return this.cita()?.tieneReceta === true;
  }

  hasDerivaciones(): boolean {
    return this.cita()?.tieneDerivaciones === true;
  }

  canModify(): boolean {
    const citaData = this.cita();
    if (!citaData || !this.isPendiente()) return false;
    return this.citasService.canModifyCita(citaData.fechaHoraInicio);
  }

  // =====================================
  // METHODS - Video Call Room
  // =====================================
  isIngresarSalaReady(): boolean {
    const citaData = this.cita();
    if (!citaData || !this.isPendiente() || !citaData.telefonica) return false;

    return isAppointmentTimeReady(citaData.fechaHoraInicio);
  }

  hasSalaExpired(): boolean {
    const citaData = this.cita();
    if (!citaData || !citaData.telefonica) return false;

    // Verificar si la cita ya expiró
    return hasAppointmentExpired(citaData.fechaHoraInicio, citaData.fechaHoraFin);
  }

  getTimeUntilSalaReady(): string {
    const citaData = this.cita();
    if (!citaData || !citaData.telefonica) return '';

    return getTimeUntilReady(citaData.fechaHoraInicio);
  }

  ingresarASala(): void {
    const citaData = this.cita();
    if (!citaData) return;

    // TODO: Navigate to video call room when backend is ready
    // Por ahora mostramos un mensaje temporal
    console.log(`Ingresando a sala de videollamada para cita ${citaData.id}`);

    // Navegación futura (cuando el backend esté listo):
    // this.router.navigate(['/citas', citaData.id, 'sala-espera']);

    // Mensaje temporal hasta que implementemos la videollamada
    alert('Sala de videollamada en desarrollo. Esta función estará disponible pronto.');
  }

  async generarLinkInvitado(): Promise<void> {
    const citaData = this.cita();
    if (!citaData) return;

    try {
      const guestData: GenerarInvitacionDto = {
        nombreInvitado: 'Invitado',
        rolInvitado: 'invitado',
      };

      const response = await this.videoCallService.createInvitation(citaData.id, guestData);

      // Copiar al portapapeles
      await navigator.clipboard.writeText(response.accessUrl);

      // Mostrar mensaje de éxito
      this.successMessage.set(`Link de invitado generado: ${response.accessUrl}`);

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        this.successMessage.set(null);
      }, 5000);
    } catch (error: any) {
      console.error('Error generating guest link:', error);
      this.error.set(error?.message || 'Error al generar link de invitado');
    }
  }

  // =====================================
  // METHODS - Edit/Delete
  // =====================================
  editarCita(): void {
    const modal = this.editModal();
    if (modal) {
      modal.open();
    }
  }

  onModalSave(): void {
    // Reload cita details after successful edit
    this.successMessage.set('Cita actualizada exitosamente');
    this.loadCitaDetalle();

    // Clear success message after 3 seconds
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  // Show cancel confirmation dialog
  showCancelDialog(): void {
    this.showCancelConfirm.set(true);
  }

  // Hide cancel confirmation dialog
  hideCancelDialog(): void {
    this.showCancelConfirm.set(false);
  }

  // Confirm cancellation
  async confirmCancelCita(): Promise<void> {
    this.loading.set(true);
    try {
      const citaId = this.cita()?.id;
      if (!citaId) return;

      await this.citasService.cancelCita(citaId);
      this.showCancelConfirm.set(false);
      this.router.navigate(['/citas']);
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      this.error.set(error?.error?.message || 'Error al cancelar la cita');
      this.showCancelConfirm.set(false);
    } finally {
      this.loading.set(false);
    }
  }
}
