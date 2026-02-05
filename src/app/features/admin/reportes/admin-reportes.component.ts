import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  FiltroReporteDto,
  ReporteEstadisticoDto,
} from '../../../core/services/reportes.service';
import { ReportesService } from '../../../core/services/reportes.service';

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-reportes.html',
  styles: [
    `
      :host {
        display: block;
      }
      .chart-bar {
        transition: width 0.5s ease-out;
      }
    `,
  ],
})
export class AdminReportesComponent {
  readonly reportesService = inject(ReportesService);

  // Signals de estado
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly datos = signal<ReporteEstadisticoDto | null>(null);

  // Filtros
  readonly fechaInicio = signal('');
  readonly fechaFin = signal('');
  readonly tipoCita = signal<'TODOS' | 'VIRTUAL' | 'PRESENCIAL'>('TODOS');

  constructor() {
    this.cargarDatos();
  }

  /**
   * Cargar datos del reporte
   */
  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltroReporteDto = {
      fechaInicio: this.fechaInicio() || undefined,
      fechaFin: this.fechaFin() || undefined,
      tipo: this.tipoCita(),
    };

    this.reportesService.getEstadisticas(filtros).subscribe({
      next: (data) => {
        this.datos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los reportes');
        this.loading.set(false);
        console.error('Error cargando reportes:', err);
      },
    });
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros(): void {
    this.cargarDatos();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.tipoCita.set('TODOS');
    this.cargarDatos();
  }

  /**
   * Exportar a CSV
   */
  exportarCSV(): void {
    const datos = this.datos();
    if (datos) {
      this.reportesService.exportarCSV(datos);
    }
  }

  /**
   * Calcular porcentaje de asistencia
   */
  getPorcentajeAsistencia(): number {
    const datos = this.datos();
    if (!datos || datos.totalCitas === 0) return 0;
    return this.reportesService.calcularPorcentaje(datos.citasAtendidas, datos.totalCitas);
  }

  /**
   * Calcular porcentaje de cancelación
   */
  getPorcentajeCancelacion(): number {
    const datos = this.datos();
    if (!datos || datos.totalCitas === 0) return 0;
    return this.reportesService.calcularPorcentaje(datos.citasCanceladas, datos.totalCitas);
  }

  /**
   * Obtener el valor máximo para normalizar gráficos
   */
  getMaximoMes(): number {
    const datos = this.datos();
    if (!datos || datos.citasPorMes.length === 0) return 1;
    return Math.max(...datos.citasPorMes.map((m) => m.cantidad));
  }

  getMaximoMedico(): number {
    const datos = this.datos();
    if (!datos || datos.citasPorMedico.length === 0) return 1;
    return Math.max(...datos.citasPorMedico.map((m) => m.cantidad));
  }

  getMaximoEspecialidad(): number {
    const datos = this.datos();
    if (!datos || datos.citasPorEspecialidad.length === 0) return 1;
    return Math.max(...datos.citasPorEspecialidad.map((e) => e.cantidad));
  }

  /**
   * Formatear número
   */
  formatNum(num: number): string {
    return this.reportesService.formatearNumero(num);
  }

  /**
   * Verificar si hay filtros activos
   */
  tieneFiltrosActivos(): boolean {
    return !!(this.fechaInicio() || this.fechaFin() || this.tipoCita() !== 'TODOS');
  }
}
