import { Injectable, signal } from '@angular/core';

// ==========================================
// Configuración DTOs
// ==========================================

export interface HorarioHospital {
  diaSemana: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  horaApertura: string; // Format: "HH:mm"
  horaCierre: string; // Format: "HH:mm"
  abierto: boolean;
}

export interface ConfiguracionHospital {
  horarios: HorarioHospital[];
  duracionCitaMinutos: number;
  maxCitasPorDia: number;
  diasAnticipacionAgendar: number;
  permitirCitasTelefonicas: boolean;
  notificacionesEmail: boolean;
  notificacionesSMS: boolean;
  tiempoRecordatorioHoras: number;
}

export interface DiaFestivo {
  id: string;
  fecha: string; // Format: "YYYY-MM-DD"
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  private readonly STORAGE_KEY = 'hospital_config';
  private readonly FESTIVOS_KEY = 'hospital_festivos';

  // Signals para estado reactivo
  readonly configuracion = signal<ConfiguracionHospital>(this.getConfiguracionInicial());
  readonly festivos = signal<DiaFestivo[]>(this.getFestivosIniciales());

  constructor() {
    this.cargarConfiguracion();
    this.cargarFestivos();
  }

  private getConfiguracionInicial(): ConfiguracionHospital {
    return {
      horarios: [
        { diaSemana: 1, horaApertura: '08:00', horaCierre: '18:00', abierto: true }, // Lunes
        { diaSemana: 2, horaApertura: '08:00', horaCierre: '18:00', abierto: true }, // Martes
        { diaSemana: 3, horaApertura: '08:00', horaCierre: '18:00', abierto: true }, // Miércoles
        { diaSemana: 4, horaApertura: '08:00', horaCierre: '18:00', abierto: true }, // Jueves
        { diaSemana: 5, horaApertura: '08:00', horaCierre: '18:00', abierto: true }, // Viernes
        { diaSemana: 6, horaApertura: '08:00', horaCierre: '12:00', abierto: true }, // Sábado
        { diaSemana: 0, horaApertura: '00:00', horaCierre: '00:00', abierto: false }, // Domingo
      ],
      duracionCitaMinutos: 30,
      maxCitasPorDia: 50,
      diasAnticipacionAgendar: 30,
      permitirCitasTelefonicas: true,
      notificacionesEmail: true,
      notificacionesSMS: false,
      tiempoRecordatorioHoras: 24,
    };
  }

  private getFestivosIniciales(): DiaFestivo[] {
    return [];
  }

  private cargarConfiguracion(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.configuracion.set({ ...this.getConfiguracionInicial(), ...parsed });
        } catch (e) {
          console.error('Error cargando configuración:', e);
        }
      }
    }
  }

  private cargarFestivos(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.FESTIVOS_KEY);
      if (saved) {
        try {
          this.festivos.set(JSON.parse(saved));
        } catch (e) {
          console.error('Error cargando festivos:', e);
        }
      }
    }
  }

  guardarConfiguracion(config: ConfiguracionHospital): void {
    this.configuracion.set(config);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    }
  }

  guardarFestivos(festivos: DiaFestivo[]): void {
    this.festivos.set(festivos);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.FESTIVOS_KEY, JSON.stringify(festivos));
    }
  }

  agregarFestivo(festivo: DiaFestivo): void {
    const current = this.festivos();
    this.guardarFestivos([...current, festivo]);
  }

  eliminarFestivo(id: string): void {
    const current = this.festivos();
    this.guardarFestivos(current.filter((f) => f.id !== id));
  }

  getNombreDia(diaSemana: number): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[diaSemana];
  }

  /**
   * Cuando el backend tenga endpoints, descomentar y usar:
   *
   * async cargarConfiguracionBackend(): Promise<void> {
   *   const response = await firstValueFrom(
   *     this.http.get<ConfiguracionResponseDto>(`${environment.apiUrl}/configuracion`)
   *   );
   *   this.configuracion.set(response.data);
   * }
   *
   * async guardarConfiguracionBackend(config: ConfiguracionHospital): Promise<void> {
   *   await firstValueFrom(
   *     this.http.post(`${environment.apiUrl}/configuracion`, config)
   *   );
   *   this.configuracion.set(config);
   * }
   */
}
