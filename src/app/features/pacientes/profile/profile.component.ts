import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  type CompletarPerfilDto,
  CompletarPerfilService,
  type EstiloVidaDto,
  type GrupoSanguineoDto,
  type PaisDto,
} from '../../../core/services/completar-perfil.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly perfilService = inject(CompletarPerfilService);

  readonly user = this.authService.user;

  // Modal state
  readonly showModal = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  // Form fields
  telefono = '';
  fecha = '';
  pais = '';
  residencia = '';
  sangre = '';
  estiloVida = '';

  // Data from API
  readonly paises = signal<PaisDto[]>([]);
  readonly gruposSanguineos = signal<GrupoSanguineoDto[]>([]);
  readonly estilosVida = signal<EstiloVidaDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      const [paises, grupos, estilos] = await Promise.all([
        this.perfilService.getPaises().toPromise(),
        this.perfilService.getGruposSanguineos().toPromise(),
        this.perfilService.getEstilosVida().toPromise(),
      ]);

      this.paises.set(paises || []);
      this.gruposSanguineos.set(grupos || []);
      this.estilosVida.set(estilos || []);

      // Prellenar formulario con datos actuales del usuario
      const userData = this.user();
      if (userData) {
        this.telefono = userData.telefono || '';
        // La edad viene calculada, necesitaríamos la fecha de nacimiento del backend
        this.pais = userData.pais || '';
        this.residencia = userData.residencia || '';
        this.sangre = userData.sangre || '';
        this.estiloVida = userData.estilo || '';
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  /**
   * Abre el modal de edición
   */
  openEditModal(): void {
    this.error.set(null);
    this.showModal.set(true);
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.showModal.set(false);
  }

  /**
   * Guarda los cambios
   */
  async guardar(): Promise<void> {
    if (
      !this.telefono.trim() ||
      !this.fecha ||
      !this.pais ||
      !this.residencia.trim() ||
      !this.sangre ||
      !this.estiloVida
    ) {
      this.error.set('Por favor completa todos los campos obligatorios');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const data: CompletarPerfilDto = {
      telefono: this.telefono.trim(),
      fecha: this.fecha,
      pais: this.pais,
      residencia: this.residencia.trim(),
      sangre: this.sangre,
      estiloVida: this.estiloVida,
    };

    try {
      await this.perfilService.updateInfo(data).toPromise();
      await this.authService.loadUserProfile();
      this.closeModal();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar la información';
      this.error.set(errorMsg);
      console.error('Error actualizando perfil:', err);
    } finally {
      this.enviando.set(false);
    }
  }
}
