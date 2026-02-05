import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { FiltroAuditoriaDto, LogAuditoriaDto } from '../../../core/services/audit.service';
import { AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-admin-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-auditoria.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AdminAuditoriaComponent {
  private readonly auditService = inject(AuditService);

  // Signals de estado
  readonly logs = signal<LogAuditoriaDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Opciones de filtros
  readonly acciones = this.auditService.getAcciones();
  readonly entidades = this.auditService.getEntidades();

  // Filtros
  readonly fechaInicio = signal('');
  readonly fechaFin = signal('');
  readonly accion = signal('TODOS');
  readonly entidad = signal('TODOS');
  readonly busqueda = signal('');

  constructor() {
    this.cargarLogs();
  }

  // Computed signals para estadísticas
  readonly totalLogs = computed(() => this.logs().length);

  readonly totalAuth = computed(() => this.logs().filter((l) => l.entidad === 'Auth').length);

  readonly totalAcciones = computed(
    () => this.logs().filter((l) => l.accion === 'CREATE' || l.accion === 'LOGIN').length
  );

  readonly totalUsuariosUnicos = computed(() => {
    return new Set(this.logs().map((l) => l.usuarioEmail)).size;
  });

  /**
   * Cargar logs de auditoría
   */
  cargarLogs(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltroAuditoriaDto = {
      fechaInicio: this.fechaInicio() || undefined,
      fechaFin: this.fechaFin() || undefined,
      accion: this.accion(),
      entidad: this.entidad(),
      busqueda: this.busqueda() || undefined,
    };

    this.auditService.getLogs(filtros).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los registros de auditoría');
        this.loading.set(false);
        console.error('Error cargando auditoría:', err);
      },
    });
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros(): void {
    this.cargarLogs();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.accion.set('TODOS');
    this.entidad.set('TODOS');
    this.busqueda.set('');
    this.cargarLogs();
  }

  /**
   * Verificar si hay filtros activos
   */
  tieneFiltrosActivos(): boolean {
    return !!(
      this.fechaInicio() ||
      this.fechaFin() ||
      this.accion() !== 'TODOS' ||
      this.entidad() !== 'TODOS' ||
      this.busqueda()
    );
  }

  /**
   * Obtener clase CSS para acción
   */
  getAccionClass(accion: string): string {
    return this.auditService.getAccionClass(accion);
  }

  /**
   * Obtener icono para acción
   */
  getAccionIcon(accion: string): string {
    return this.auditService.getAccionIcon(accion);
  }

  /**
   * Formatear fecha
   */
  formatFecha(fecha: string): string {
    return this.auditService.formatFechaDisplay(fecha);
  }

  /**
   * Formatear fecha relativa
   */
  formatFechaRelativa(fecha: string): string {
    return this.auditService.formatFechaRelativa(fecha);
  }

  /**
   * Truncar texto
   */
  truncate(texto: string | undefined, longitud: number = 60): string {
    if (!texto) return '-';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
  }
}
