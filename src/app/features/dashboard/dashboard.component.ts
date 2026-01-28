import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CitasService } from '../../core/services/citas.service';
import { CitaResponseDto } from '../../core/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly citasService = inject(CitasService);
  private readonly router = inject(Router);
  
  readonly user = this.authService.user;
  readonly proximaCita = signal<CitaResponseDto | null>(null);
  readonly loadingCita = signal(false);
  
  readonly accionesRapidas = [
    {
      icon: 'historia',
      titulo: 'Historia Clínica',
      route: '/historia-clinica'
    },
    {
      icon: 'recetas',
      titulo: 'Mis Recetas',
      route: '/recetas'
    },
    {
      icon: 'documentos',
      titulo: 'Documentos',
      route: '/documentos'
    }
  ];

  constructor() {
    this.loadProximaCita();
  }

  async loadProximaCita(): Promise<void> {
    this.loadingCita.set(true);
    try {
      const citas = await this.citasService.getProximasCitas();
      // Get the first one (most recent)
      this.proximaCita.set(citas[0] || null);
      console.log('✅ Dashboard: Próxima cita cargada:', citas[0]);
    } catch (error) {
      console.error('❌ Dashboard: Error loading próxima cita:', error);
      this.proximaCita.set(null);
    } finally {
      this.loadingCita.set(false);
    }
  }
  
  getNombrePaciente(): string {
    const nombreCompleto = this.user()?.nombreCompleto || 'Usuario';
    return nombreCompleto.split(' ')[0]; // Solo el primer nombre
  }

  // Format cita for display
  getMedicoNombre(): string {
    const cita = this.proximaCita();
    if (!cita) return '';
    return `Dr. ${cita.medico.nombre} ${cita.medico.apellido}`;
  }

  getEspecialidad(): string {
    const cita = this.proximaCita();
    return cita?.medico.especialidad || 'General';
  }

  getFecha(): Date | null {
    const cita = this.proximaCita();
    return cita ? new Date(cita.fechaHoraInicio) : null;
  }

  getHora(): string {
    const fecha = this.getFecha();
    if (!fecha) return '';
    return fecha.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + 'h';
  }
  
  ingresarCita(): void {
    const citaId = this.proximaCita()?.id;
    if (citaId) {
      this.router.navigate(['/citas', citaId]);
    }
  }
  
  agendarCita(): void {
    this.router.navigate(['/citas/agendar']);
  }
}
