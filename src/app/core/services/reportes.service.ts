import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';

/**
 * Interfaces para Reportes
 */
export interface FiltroReporteDto {
  fechaInicio?: string;
  fechaFin?: string;
  medicoId?: number;
  especialidadId?: number;
  tipo?: 'VIRTUAL' | 'PRESENCIAL' | 'TODOS';
}

export interface ReporteEstadisticoDto {
  periodo: { inicio: string; fin: string };
  totalCitas: number;
  citasAtendidas: number;
  citasCanceladas: number;
  citasPendientes: number;
  promedioCitasPorDia: number;
  citasPorMes: { mes: string; cantidad: number }[];
  citasPorMedico: { medico: string; cantidad: number }[];
  citasPorEspecialidad: { especialidad: string; cantidad: number }[];
  citasPorTipo: { tipo: string; cantidad: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly apiUrl = '/reportes';

  // Estado para datos mockeados (pendiente backend)
  private readonly mockData: ReporteEstadisticoDto = {
    periodo: { inicio: '2025-01-01', fin: '2025-12-31' },
    totalCitas: 1247,
    citasAtendidas: 892,
    citasCanceladas: 187,
    citasPendientes: 168,
    promedioCitasPorDia: 4.2,
    citasPorMes: [
      { mes: 'Ene', cantidad: 78 },
      { mes: 'Feb', cantidad: 92 },
      { mes: 'Mar', cantidad: 105 },
      { mes: 'Abr', cantidad: 88 },
      { mes: 'May', cantidad: 112 },
      { mes: 'Jun', cantidad: 98 },
      { mes: 'Jul', cantidad: 85 },
      { mes: 'Ago', cantidad: 76 },
      { mes: 'Sep', cantidad: 110 },
      { mes: 'Oct', cantidad: 125 },
      { mes: 'Nov', cantidad: 142 },
      { mes: 'Dic', cantidad: 136 },
    ],
    citasPorMedico: [
      { medico: 'Dr. García', cantidad: 245 },
      { medico: 'Dra. López', cantidad: 198 },
      { medico: 'Dr. Martínez', cantidad: 176 },
      { medico: 'Dra. Rodríguez', cantidad: 189 },
      { medico: 'Dr. Fernández', cantidad: 156 },
    ],
    citasPorEspecialidad: [
      { especialidad: 'Cardiología', cantidad: 312 },
      { especialidad: 'Pediatría', cantidad: 278 },
      { especialidad: 'Dermatología', cantidad: 198 },
      { especialidad: 'Neurología', cantidad: 156 },
      { especialidad: 'Ortopedia', cantidad: 134 },
      { especialidad: 'Oftalmología', cantidad: 98 },
    ],
    citasPorTipo: [
      { tipo: 'Virtual', cantidad: 534 },
      { tipo: 'Presencial', cantidad: 713 },
    ],
  };

  /**
   * Obtener estadísticas generales
   * Nota: Por ahora retorna datos mockeados. Cuando el backend implemente el endpoint,
   * reemplaza con llamada real.
   */
  getEstadisticas(filtros: FiltroReporteDto = {}): Observable<ReporteEstadisticoDto> {
    // Simular llamada al backend
    return of(this.mockData).pipe(delay(500));
  }

  /**
   * Exportar reporte a CSV
   */
  exportarCSV(datos: ReporteEstadisticoDto): void {
    // Generar CSV básico
    const headers = ['Métrica', 'Cantidad'];
    const rows = [
      ['Total Citas', datos.totalCitas.toString()],
      ['Citas Atendidas', datos.citasAtendidas.toString()],
      ['Citas Canceladas', datos.citasCanceladas.toString()],
      ['Citas Pendientes', datos.citasPendientes.toString()],
      ['Promedio por Día', datos.promedioCitasPorDia.toString()],
    ];

    // Agregar datos por mes
    rows.push(['', '']);
    rows.push(['Por Mes', '']);
    datos.citasPorMes.forEach((m) => {
      rows.push([m.mes, m.cantidad.toString()]);
    });

    // Agregar datos por médico
    rows.push(['', '']);
    rows.push(['Por Médico', '']);
    datos.citasPorMedico.forEach((m) => {
      rows.push([m.medico, m.cantidad.toString()]);
    });

    // Agregar datos por especialidad
    rows.push(['', '']);
    rows.push(['Por Especialidad', '']);
    datos.citasPorEspecialidad.forEach((e) => {
      rows.push([e.especialidad, e.cantidad.toString()]);
    });

    // Crear CSV
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_citas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Calcular porcentaje
   */
  calcularPorcentaje(parcial: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((parcial / total) * 100);
  }

  /**
   * Formatear número
   */
  formatearNumero(num: number): string {
    return new Intl.NumberFormat('es-ES').format(num);
  }

  /**
   * Obtener fecha actual formateada
   */
  getFechaActual(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
