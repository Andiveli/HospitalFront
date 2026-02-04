import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  CreatePacienteEnfermedadDto,
  EnfermedadDto,
  PacienteEnfermedadDto,
  TipoEnfermedadDto,
} from '../../../core/models';
import { EnfermedadService } from '../../../core/services/enfermedad.service';

/**
 * Componente reutilizable para agregar enfermedades a un paciente.
 *
 * Solo puede ser usado por médicos (el endpoint valida rol en backend).
 *
 * Usage:
 * ```html
 * <app-agregar-enfermedad
 *   [pacienteId]="pacienteId()"
 *   (enfermedadAgregada)="onEnfermedadAgregada($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-agregar-enfermedad',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './agregar-enfermedad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AgregarEnfermedadComponent {
  private readonly enfermedadService = inject(EnfermedadService);

  // =====================================
  // INPUTS / OUTPUTS
  // =====================================

  /** ID del paciente al que se le agregará la enfermedad (requerido) */
  pacienteId = input.required<number>();

  /** Emite cuando se agrega una enfermedad exitosamente */
  enfermedadAgregada = output<PacienteEnfermedadDto>();

  // =====================================
  // STATE - Catálogos
  // =====================================
  enfermedades = signal<EnfermedadDto[]>([]);
  tiposEnfermedad = signal<TipoEnfermedadDto[]>([]);
  loadingCatalogos = signal(false);
  catalogosError = signal<string | null>(null);

  // =====================================
  // STATE - Formulario
  // =====================================
  selectedEnfermedadId = signal<number | null>(null);
  selectedTipoEnfermedadId = signal<number | null>(null);
  detalle = signal('');

  // =====================================
  // STATE - UI
  // =====================================
  isOpen = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // =====================================
  // COMPUTED
  // =====================================

  /** Determina si el formulario es válido para enviar */
  isFormValid = computed(() => {
    return this.selectedEnfermedadId() !== null && this.selectedTipoEnfermedadId() !== null;
  });

  /** Obtiene el nombre de la enfermedad seleccionada */
  selectedEnfermedadNombre = computed(() => {
    const id = this.selectedEnfermedadId();
    if (!id) return '';
    const enfermedad = this.enfermedades().find((e) => e.id === id);
    return enfermedad?.nombre ?? '';
  });

  // =====================================
  // LIFECYCLE
  // =====================================
  constructor() {
    // Cargar catálogos cuando el componente se abre
    effect(() => {
      if (this.isOpen() && this.enfermedades().length === 0) {
        this.loadCatalogos();
      }
    });
  }

  // =====================================
  // METHODS - UI
  // =====================================

  /** Abre el panel de agregar enfermedad */
  open(): void {
    this.isOpen.set(true);
    this.resetForm();
  }

  /** Cierra el panel de agregar enfermedad */
  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  /** Toggle del panel */
  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  // =====================================
  // METHODS - Data
  // =====================================

  /** Carga los catálogos de enfermedades y tipos */
  async loadCatalogos(): Promise<void> {
    this.loadingCatalogos.set(true);
    this.catalogosError.set(null);

    try {
      const [enfermedades, tipos] = await Promise.all([
        this.enfermedadService.getEnfermedades(),
        this.enfermedadService.getTiposEnfermedad(),
      ]);

      this.enfermedades.set(enfermedades);
      this.tiposEnfermedad.set(tipos);
    } catch (error: unknown) {
      console.error('Error loading catalogues:', error);

      let errorMessage = 'Error al cargar los catálogos';

      // Manejar errores HTTP
      if (typeof error === 'object' && error !== null) {
        const httpError = error as { status?: number; error?: { message?: string; msg?: string } };

        if (httpError.status === 403) {
          errorMessage =
            'No tienes permisos para acceder a los catálogos. Verificá que estés logueado como médico.';
        } else if (httpError.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, volvé a iniciar sesión.';
        } else if (httpError.error?.message || httpError.error?.msg) {
          errorMessage = httpError.error.message || httpError.error.msg || errorMessage;
        }
      }

      this.catalogosError.set(errorMessage);
    } finally {
      this.loadingCatalogos.set(false);
    }
  }

  /** Envía el formulario para crear la relación paciente-enfermedad */
  async submit(): Promise<void> {
    if (!this.isFormValid()) return;

    this.submitting.set(true);
    this.submitError.set(null);
    this.successMessage.set(null);

    try {
      const dto: CreatePacienteEnfermedadDto = {
        pacienteId: this.pacienteId(),
        enfermedadId: this.selectedEnfermedadId()!,
        tipoEnfermedadId: this.selectedTipoEnfermedadId()!,
        detalle: this.detalle().trim() || undefined,
      };

      const result = await this.enfermedadService.createPacienteEnfermedad(dto);

      // Notificar al padre
      this.enfermedadAgregada.emit(result);

      // Mostrar mensaje de éxito brevemente y resetear
      this.successMessage.set(`Enfermedad "${this.selectedEnfermedadNombre()}" agregada`);

      // Resetear formulario rápido (500ms para que se vea el mensaje)
      setTimeout(() => {
        this.resetForm();
        this.successMessage.set(null);
      }, 500);
    } catch (error: unknown) {
      console.error('Error creating patient-disease relationship:', error);
      let errorMessage = 'Error al agregar la enfermedad';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Manejar errores específicos del backend
      if (typeof error === 'object' && error !== null && 'error' in error) {
        const httpError = error as { error?: { message?: string } };
        if (httpError.error?.message) {
          errorMessage = httpError.error.message;
        }
      }

      this.submitError.set(errorMessage);
    } finally {
      this.submitting.set(false);
    }
  }

  // =====================================
  // METHODS - Helpers
  // =====================================

  /** Resetea el formulario a su estado inicial */
  private resetForm(): void {
    this.selectedEnfermedadId.set(null);
    this.selectedTipoEnfermedadId.set(null);
    this.detalle.set('');
    this.submitError.set(null);
  }

  /** Handler para el select de enfermedad */
  onEnfermedadChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedEnfermedadId.set(value ? parseInt(value, 10) : null);
  }

  /** Handler para el select de tipo de enfermedad */
  onTipoEnfermedadChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedTipoEnfermedadId.set(value ? parseInt(value, 10) : null);
  }

  /** Handler para el textarea de detalle */
  onDetalleChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.detalle.set(target.value);
  }
}
