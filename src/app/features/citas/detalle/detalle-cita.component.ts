import { Component, signal, inject, input, viewChild, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../../core/services/citas.service';
import {
  CitaDetalladaResponseDto,
  formatMedicoNombreSimplificado,
} from '../../../core/models';
import EditCitaModalComponent from '../../../shared/components/edit-cita-modal/edit-cita-modal.component';

@Component({
  selector: 'app-detalle-cita',
  imports: [CommonModule, EditCitaModalComponent],
  templateUrl: './detalle-cita.component.html',
  styleUrl: './detalle-cita.component.scss',
})
export default class DetalleCitaComponent {
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);

  // Route param (id) - optional because it's loaded async
  id = input<string>();

  // Modal reference
  editModal = viewChild<EditCitaModalComponent>('editModal');

  // =====================================
  // STATE
  // =====================================
  cita = signal<CitaDetalladaResponseDto | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Load cita when id changes (using effect to wait for input to be available)
    effect(() => {
      const citaId = this.id();
      console.log('🔍 DetalleCita effect - citaId:', citaId);
      if (citaId) {
        console.log('✅ DetalleCita - calling loadCitaDetalle()');
        this.loadCitaDetalle();
      } else {
        console.log('⏳ DetalleCita - waiting for citaId...');
      }
    });
  }

  // =====================================
  // METHODS - Load Data
  // =====================================
  async loadCitaDetalle(): Promise<void> {
    console.log('📥 loadCitaDetalle - START');
    this.loading.set(true);
    this.error.set(null);
    try {
      const citaIdStr = this.id();
      console.log('📥 loadCitaDetalle - citaIdStr:', citaIdStr);
      
      if (!citaIdStr) {
        throw new Error('ID de cita no disponible');
      }

      const citaId = parseInt(citaIdStr, 10);
      console.log('📥 loadCitaDetalle - citaId parsed:', citaId);
      
      if (isNaN(citaId)) {
        throw new Error('ID de cita inválido');
      }

      const cita = await this.citasService.getCitaDetalle(citaId);
      console.log('✅ loadCitaDetalle - cita loaded:', cita);
      this.cita.set(cita);
    } catch (error: any) {
      console.error('❌ Error loading appointment details:', error);
      this.error.set(
        error?.error?.message || 'Error al cargar los detalles de la cita.'
      );
    } finally {
      this.loading.set(false);
      console.log('📥 loadCitaDetalle - END, loading:', this.loading(), 'cita:', this.cita());
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
    this.loadCitaDetalle();
  }

  async eliminarCita(): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return;
    }

    try {
      const citaId = this.cita()?.id;
      if (!citaId) return;

      await this.citasService.cancelCita(citaId);
      alert('Cita cancelada exitosamente');
      this.router.navigate(['/citas']);
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      alert(error?.error?.message || 'Error al cancelar la cita');
    }
  }
}
