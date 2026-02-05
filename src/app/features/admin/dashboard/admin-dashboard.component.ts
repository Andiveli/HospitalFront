import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AdminService,
  type DashboardStats,
  type MedicoConExcepciones,
} from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;

  // State
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<DashboardStats>({
    citasAtendidas: 0,
    citasPendientes: 0,
    citasCanceladas: 0,
    totalMedicos: 0,
    totalPacientes: 0,
    excepcionesPendientes: 0,
  });
  readonly medicosConExcepciones = signal<MedicoConExcepciones[]>([]);

  // Computed: solo excepciones futuras de los médicos
  readonly excepcionesFuturas = computed(() => {
    const medicos = this.medicosConExcepciones();
    return medicos
      .map((m) => ({
        ...m,
        excepciones: m.excepciones.filter((e) => this.adminService.isFutureException(e.fecha)),
      }))
      .filter((m) => m.excepciones.length > 0);
  });

  readonly totalExcepcionesFuturas = computed(() => {
    return this.excepcionesFuturas().reduce((acc, m) => acc + m.excepciones.length, 0);
  });

  // Effect: cargar datos al inicializar
  constructor() {
    effect(() => {
      // Solo corre una vez al inicializar
      void this.loadDashboardData();
    });
  }

  async loadDashboardData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [stats, excepciones] = await Promise.all([
        this.adminService.getDashboardStats(),
        this.adminService.getAllExcepciones(),
      ]);

      this.stats.set(stats);
      this.medicosConExcepciones.set(excepciones);
    } catch (err) {
      this.error.set('Error al cargar los datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  formatFecha(fecha: string): string {
    return this.adminService.formatFechaDisplay(fecha);
  }

  formatHorario(excepcion: MedicoConExcepciones['excepciones'][0]): string {
    return this.adminService.formatHorario(excepcion);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
