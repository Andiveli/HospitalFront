import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  formatRecetaDate,
  formatRecetaTime,
  getTratamientoResumen,
  type MedicamentoRecetaPacienteDto,
  type RecetaPacienteDto,
} from '../../../core/models';
import {
  type RecetasError,
  RecetasService,
} from '../../../core/services/recetas.service';

/**
 * Componente para mostrar y gestionar las recetas médicas del paciente
 *
 * Features:
 * - Lista de recetas con información del médico, fecha y resumen de medicamentos
 * - Vista detallada de cada receta con todos los medicamentos
 * - Diseño responsive siguiendo la consistencia de la app
 * - Manejo de errores con mensajes específicos del backend
 *
 * Endpoint utilizado: GET /recetas/paciente/mis-recetas
 */
@Component({
  selector: 'app-recetas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recetas.html',
})
export class RecetasComponent {
  private readonly recetasService = inject(RecetasService);

  // ==========================================
  // State Signals
  // ==========================================

  /** Lista de recetas del paciente */
  readonly recetas = signal<RecetaPacienteDto[]>([]);

  /** Total de recetas */
  readonly totalRecetas = signal<number>(0);

  /** Receta seleccionada para ver detalle */
  readonly selectedReceta = signal<RecetaPacienteDto | null>(null);

  /** Estado de carga */
  readonly loading = signal<boolean>(true);

  /** Error al cargar recetas - muestra mensaje específico del backend */
  readonly error = signal<string | null>(null);

  // ==========================================
  // Computed Signals
  // ==========================================

  /** Verifica si hay una receta seleccionada */
  readonly hasSelectedReceta = computed(() => this.selectedReceta() !== null);

  // ==========================================
  // Effects
  // ==========================================

  /** Carga las recetas al iniciar el componente */
  private loadRecetasEffect = effect(() => {
    this.loadRecetas();
  });

  // ==========================================
  // Methods
  // ==========================================

  /**
   * Carga las recetas del paciente desde el backend
   */
  async loadRecetas(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.recetasService.getMisRecetas();
      this.recetas.set(data.recetas);
      this.totalRecetas.set(data.totalRecetas);
    } catch (err: unknown) {
      console.error('Error loading recetas:', err);

      // Extraer el mensaje específico del backend
      let errorMessage: string;

      if (err instanceof Error) {
        const recetasError = err as RecetasError;
        errorMessage =
          recetasError.backendMessage ||
          recetasError.message ||
          'Error al cargar las recetas';
      } else {
        errorMessage = 'Error al cargar las recetas';
      }

      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Selecciona una receta para ver su detalle
   *
   * @param receta - Receta a seleccionar
   */
  selectReceta(receta: RecetaPacienteDto): void {
    this.selectedReceta.set(receta);
  }

  /**
   * Cierra la vista de detalle y vuelve a la lista
   */
  closeDetail(): void {
    this.selectedReceta.set(null);
  }

  /**
   * Obtiene el resumen de medicamentos para la lista
   *
   * @param medicamentos - Lista de medicamentos
   */
  getMedicamentosResumen(medicamentos: MedicamentoRecetaPacienteDto[]): string {
    return getTratamientoResumen(medicamentos);
  }

  /**
   * Formatea la fecha de la receta
   *
   * @param dateString - Fecha en formato ISO
   */
  formatDate(dateString: string): string {
    return formatRecetaDate(dateString);
  }

  /**
   * Formatea la hora de la receta
   *
   * @param dateString - Fecha en formato ISO
   */
  formatTime(dateString: string): string {
    return formatRecetaTime(dateString);
  }

  /**
   * Obtiene la clase de color según la vía de administración
   *
   * @param via - Vía de administración del medicamento
   */
  getViaAdministracionClass(via: string): string {
    const viaLower = via.toLowerCase();
    if (viaLower.includes('oral')) {
      return 'bg-blue-100 text-blue-800';
    } else if (viaLower.includes('intravenosa') || viaLower.includes('iv')) {
      return 'bg-red-100 text-red-800';
    } else if (viaLower.includes('tópica') || viaLower.includes('crema')) {
      return 'bg-green-100 text-green-800';
    } else if (viaLower.includes('inhalada')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  }
}
