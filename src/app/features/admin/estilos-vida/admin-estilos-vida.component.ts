import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  CreateEstiloVidaDto,
  EstiloVidaDto,
  UpdateEstiloVidaDto,
} from '../../../core/services/estilos-vida.service';
import { EstilosVidaService } from '../../../core/services/estilos-vida.service';

@Component({
  selector: 'app-admin-estilos-vida',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-estilos-vida.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AdminEstilosVidaComponent {
  private readonly estilosService = inject(EstilosVidaService);

  // Signals de estado
  readonly estilos = signal<EstiloVidaDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  // Modal state
  readonly showModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  // Form state
  readonly editingId = signal<number | null>(null);
  readonly nombre = signal('');
  readonly descripcion = signal('');
  readonly categoria = signal<'HABITO' | 'DIETA' | 'EJERCICIO' | 'SUSTANCIA' | 'OTRO'>('HABITO');

  // Opciones
  readonly categorias = this.estilosService.getCategorias();

  constructor() {
    this.cargarEstilos();
  }

  // Computed signals para estadísticas
  readonly totalDietas = computed(
    () => this.estilos().filter((e) => e.categoria === 'DIETA').length
  );

  readonly totalEjercicios = computed(
    () => this.estilos().filter((e) => e.categoria === 'EJERCICIO').length
  );

  readonly totalSustancias = computed(
    () => this.estilos().filter((e) => e.categoria === 'SUSTANCIA').length
  );

  readonly totalActivos = computed(() => this.estilos().filter((e) => e.activo).length);

  /**
   * Cargar estilos de vida
   */
  cargarEstilos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.estilosService.getEstilos().subscribe({
      next: (estilos) => {
        this.estilos.set(estilos);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los estilos de vida');
        this.loading.set(false);
        console.error('Error cargando estilos de vida:', err);
      },
    });
  }

  /**
   * Abrir modal para crear
   */
  openCreateModal(): void {
    this.modalMode.set('create');
    this.resetForm();
    this.showModal.set(true);
  }

  /**
   * Abrir modal para editar
   */
  openEditModal(estilo: EstiloVidaDto): void {
    this.modalMode.set('edit');
    this.editingId.set(estilo.id);
    this.nombre.set(estilo.nombre);
    this.descripcion.set(estilo.descripcion);
    this.categoria.set(estilo.categoria as any);
    this.showModal.set(true);
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.editingId.set(null);
    this.nombre.set('');
    this.descripcion.set('');
    this.categoria.set('HABITO');
    this.formError.set(null);
  }

  /**
   * Guardar (crear o actualizar)
   */
  async guardar(): Promise<void> {
    // Validación
    if (!this.nombre().trim()) {
      this.formError.set('El nombre es obligatorio');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    try {
      if (this.modalMode() === 'create') {
        const data: CreateEstiloVidaDto = {
          nombre: this.nombre().trim(),
          descripcion: this.descripcion().trim(),
          categoria: this.categoria(),
        };

        await this.estilosService.createEstilo(data).toPromise();
        this.success.set('Estilo de vida creado exitosamente');
      } else {
        const data: UpdateEstiloVidaDto = {
          nombre: this.nombre().trim(),
          descripcion: this.descripcion().trim(),
          categoria: this.categoria(),
        };

        await this.estilosService.updateEstilo(this.editingId()!, data).toPromise();
        this.success.set('Estilo de vida actualizado exitosamente');
      }

      this.closeModal();
      this.cargarEstilos();

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => this.success.set(null), 3000);
    } catch (err) {
      this.formError.set('Error al guardar. Por favor intente nuevamente.');
      console.error('Error guardando:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Eliminar estilo de vida
   */
  async eliminar(id: number): Promise<void> {
    if (!confirm('¿Está seguro de que desea eliminar este estilo de vida?')) return;

    this.loading.set(true);
    try {
      await this.estilosService.deleteEstilo(id).toPromise();
      this.success.set('Estilo de vida eliminado exitosamente');
      this.cargarEstilos();

      setTimeout(() => this.success.set(null), 3000);
    } catch (err) {
      this.error.set('Error al eliminar el estilo de vida');
      console.error('Error eliminando:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Toggle activo
   */
  async toggleActivo(estilo: EstiloVidaDto): Promise<void> {
    try {
      await this.estilosService.toggleActivo(estilo.id).toPromise();
      this.cargarEstilos();
    } catch (err) {
      this.error.set('Error al cambiar el estado');
      console.error('Error toggle:', err);
    }
  }

  // Helpers para el template
  getCategoriaClass(categoria: string): string {
    return this.estilosService.getCategoriaClass(categoria);
  }

  getCategoriaLabel(categoria: string): string {
    return this.estilosService.getCategoriaLabel(categoria);
  }

  formatFecha(fecha: string): string {
    return this.estilosService.formatFecha(fecha);
  }
}
