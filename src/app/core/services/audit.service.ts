import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';

/**
 * Interfaces para Auditoría
 */
export interface LogAuditoriaDto {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  accion: string;
  entidad: string;
  entidadId?: number;
  detalles?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface FiltroAuditoriaDto {
  fechaInicio?: string;
  fechaFin?: string;
  usuarioId?: number;
  accion?: string;
  entidad?: string;
  busqueda?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly apiUrl = '/auditoria';

  // Datos mockeados para demostración
  private readonly mockLogs: LogAuditoriaDto[] = [
    {
      id: 1,
      usuarioId: 1,
      usuarioNombre: 'Dr. Juan García',
      usuarioEmail: 'jgarcia@hospital.com',
      accion: 'LOGIN',
      entidad: 'Auth',
      detalles: 'Inicio de sesión exitoso',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2026-02-05T08:30:00Z',
    },
    {
      id: 2,
      usuarioId: 2,
      usuarioNombre: 'María López',
      usuarioEmail: 'mlopez@hospital.com',
      accion: 'CREATE',
      entidad: 'Cita',
      entidadId: 150,
      detalles: 'Creación de cita #150 para paciente #45 con Dr. García',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: '2026-02-05T09:15:00Z',
    },
    {
      id: 3,
      usuarioId: 3,
      usuarioNombre: 'Admin Sistema',
      usuarioEmail: 'admin@hospital.com',
      accion: 'UPDATE',
      entidad: 'Medico',
      entidadId: 5,
      detalles: 'Actualización de especialidad del Dr. Martínez a Cardiología',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2026-02-05T10:00:00Z',
    },
    {
      id: 4,
      usuarioId: 2,
      usuarioNombre: 'María López',
      usuarioEmail: 'mlopez@hospital.com',
      accion: 'CANCEL',
      entidad: 'Cita',
      entidadId: 148,
      detalles: 'Cancelación de cita #148 - Paciente solicitó reprogramación',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: '2026-02-05T10:30:00Z',
    },
    {
      id: 5,
      usuarioId: 1,
      usuarioNombre: 'Dr. Juan García',
      usuarioEmail: 'jgarcia@hospital.com',
      accion: 'ATENDER',
      entidad: 'Consulta',
      entidadId: 150,
      detalles: 'Atención de consulta virtual completada - Duración: 25 minutos',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2026-02-05T11:00:00Z',
    },
    {
      id: 6,
      usuarioId: 4,
      usuarioNombre: 'Carlos Ruiz',
      usuarioEmail: 'cruiz@hospital.com',
      accion: 'LOGOUT',
      entidad: 'Auth',
      detalles: 'Cierre de sesión',
      ipAddress: '192.168.1.120',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
      timestamp: '2026-02-05T11:30:00Z',
    },
    {
      id: 7,
      usuarioId: 3,
      usuarioNombre: 'Admin Sistema',
      usuarioEmail: 'admin@hospital.com',
      accion: 'CREATE',
      entidad: 'Usuario',
      detalles: 'Creación de nuevo usuario: pedro@email.com (Paciente)',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2026-02-05T12:00:00Z',
    },
    {
      id: 8,
      usuarioId: 2,
      usuarioNombre: 'María López',
      usuarioEmail: 'mlopez@hospital.com',
      accion: 'UPLOAD',
      entidad: 'Documento',
      entidadId: 89,
      detalles: 'Subida de documento: Resultados_Analisis_2026.pdf',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: '2026-02-05T14:00:00Z',
    },
    {
      id: 9,
      usuarioId: 1,
      usuarioNombre: 'Dr. Juan García',
      usuarioEmail: 'jgarcia@hospital.com',
      accion: 'UPDATE',
      entidad: 'Perfil',
      detalles: 'Actualización de biografía profesional',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2026-02-05T15:00:00Z',
    },
    {
      id: 10,
      usuarioId: 3,
      usuarioNombre: 'Admin Sistema',
      usuarioEmail: 'admin@hospital.com',
      accion: 'DELETE',
      entidad: 'Medicamento',
      detalles: 'Eliminación de medicamento: Medicamento Vencido #234',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2026-02-05T16:00:00Z',
    },
  ];

  /**
   * Obtener logs de auditoría con filtros
   */
  getLogs(filtros: FiltroAuditoriaDto = {}): Observable<LogAuditoriaDto[]> {
    let filteredLogs = [...this.mockLogs];

    // Aplicar filtros
    if (filtros.fechaInicio) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= new Date(filtros.fechaInicio!)
      );
    }

    if (filtros.fechaFin) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= new Date(filtros.fechaFin!)
      );
    }

    if (filtros.accion && filtros.accion !== 'TODOS') {
      filteredLogs = filteredLogs.filter((log) => log.accion === filtros.accion);
    }

    if (filtros.entidad && filtros.entidad !== 'TODOS') {
      filteredLogs = filteredLogs.filter((log) => log.entidad === filtros.entidad);
    }

    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.usuarioNombre.toLowerCase().includes(search) ||
          log.usuarioEmail.toLowerCase().includes(search) ||
          log.detalles?.toLowerCase().includes(search)
      );
    }

    // Ordenar por fecha descendente
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return of(filteredLogs).pipe(delay(300));
  }

  /**
   * Obtener acciones disponibles para el filtro
   */
  getAcciones(): string[] {
    return ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'ATENDER', 'UPLOAD'];
  }

  /**
   * Obtener entidades disponibles para el filtro
   */
  getEntidades(): string[] {
    return [
      'Auth',
      'Usuario',
      'Cita',
      'Consulta',
      'Medico',
      'Paciente',
      'Documento',
      'Medicamento',
      'Perfil',
    ];
  }

  /**
   * Formatear fecha para display
   */
  formatFechaDisplay(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Formatear fecha relativa (hace X tiempo)
   */
  formatFechaRelativa(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;

    return this.formatFechaDisplay(fechaIso);
  }

  /**
   * Obtener clase CSS según la acción
   */
  getAccionClass(accion: string): string {
    const classes: Record<string, string> = {
      LOGIN: 'bg-emerald-100 text-emerald-700',
      LOGOUT: 'bg-slate-100 text-slate-700',
      CREATE: 'bg-blue-100 text-blue-700',
      UPDATE: 'bg-amber-100 text-amber-700',
      DELETE: 'bg-red-100 text-red-700',
      CANCEL: 'bg-orange-100 text-orange-700',
      ATENDER: 'bg-purple-100 text-purple-700',
      UPLOAD: 'bg-indigo-100 text-indigo-700',
    };
    return classes[accion] || 'bg-slate-100 text-slate-700';
  }

  /**
   * Obtener icono según la acción
   */
  getAccionIcon(accion: string): string {
    const icons: Record<string, string> = {
      LOGIN:
        'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      LOGOUT:
        'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      CREATE: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      UPDATE:
        'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      DELETE:
        'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      CANCEL: 'M6 18L18 6M6 6l12 12',
      ATENDER: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      UPLOAD: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    };
    return icons[accion] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
}
