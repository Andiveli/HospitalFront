import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { CreateExcepcionDto, ExcepcionHorarioDto } from '../../../core/models';
import { ExcepcionesHorarioService } from '../../../core/services/excepciones-horario.service';

/**
 * Vista de Excepciones de Horario para Médicos
 * Permite gestionar días bloqueados o con horarios especiales
 */
@Component({
  selector: 'app-excepciones-horario',
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './excepciones-horario.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ExcepcionesHorarioComponent {
  private readonly excepcionesService = inject(ExcepcionesHorarioService);

  // State signals
  readonly excepciones = signal<ExcepcionHorarioDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Modal state
  readonly showModal = signal(false);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  // Form state
  readonly fecha = signal('');
  readonly bloquearDiaCompleto = signal(true);
  readonly horaInicio = signal('');
  readonly horaFin = signal('');
  readonly motivo = signal('');

  // Validation
  readonly minDate = this.excepcionesService.getMinDate();

  // Computed
  readonly excepcionesOrdenadas = computed(() => {
    return [...this.excepciones()].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  });

  readonly puedeGuardar = computed(() => {
    const fecha = this.fecha();
    if (!fecha) return false;

    const diaCompleto = this.bloquearDiaCompleto();
    if (!diaCompleto) {
      const inicio = this.horaInicio();
      const fin = this.horaFin();
      if (!inicio || !fin) return false;
      if (inicio >= fin) return false;
    }

    return true;
  });

  constructor() {
    // Load exceptions on init
    effect(() => {
      this.cargarExcepciones();
    });
  }

  async cargarExcepciones(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.excepcionesService.getExcepcionesFuturas();
      this.excepciones.set(data);
    } catch {
      this.error.set('Error al cargar las excepciones');
    } finally {
      this.loading.set(false);
    }
  }

  openModal(): void {
    this.resetForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  resetForm(): void {
    this.fecha.set('');
    this.bloquearDiaCompleto.set(true);
    this.horaInicio.set('');
    this.horaFin.set('');
    this.motivo.set('');
    this.formError.set(null);
  }

  async guardarExcepcion(): Promise<void> {
    if (!this.puedeGuardar()) return;

    this.isSubmitting.set(true);
    this.formError.set(null);

    try {
      const dto: CreateExcepcionDto = {
        fecha: this.fecha(),
        motivo: this.motivo() || undefined,
      };

      if (!this.bloquearDiaCompleto()) {
        dto.horaInicio = this.horaInicio();
        dto.horaFin = this.horaFin();
      }

      await this.excepcionesService.createExcepcion(dto);
      await this.cargarExcepciones();
      this.closeModal();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear la excepción';
      this.formError.set(errorMsg);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async eliminarExcepcion(id: number): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas eliminar esta excepción?')) return;

    try {
      await this.excepcionesService.deleteExcepcion(id);
      await this.cargarExcepciones();
    } catch {
      this.error.set('Error al eliminar la excepción');
    }
  }

  // Format helpers
  formatFecha(fecha: string): string {
    return this.excepcionesService.formatFechaDisplay(fecha);
  }

  getDayName(fecha: string): string {
    return this.excepcionesService.getDayName(fecha);
  }

  formatHorario(ex: ExcepcionHorarioDto): string {
    return this.excepcionesService.formatHorario(ex);
  }
}
