import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [],
  template: `
    <div class="min-h-screen bg-slate-900 text-white p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Mi Perfil</h1>

        @if (user()) {
          <div class="bg-slate-800 rounded-lg p-6 space-y-4">
            <div>
              <label class="text-slate-400 text-sm">Nombre Completo</label>
              <p class="text-white text-lg">{{ user()?.nombreCompleto }}</p>
            </div>

            <div>
              <label class="text-slate-400 text-sm">Email</label>
              <p class="text-white text-lg">{{ user()?.email }}</p>
            </div>

            @if (user()?.edad) {
              <div>
                <label class="text-slate-400 text-sm">Edad</label>
                <p class="text-white text-lg">{{ user()?.edad }} años</p>
              </div>
            }

            @if (user()?.genero) {
              <div>
                <label class="text-slate-400 text-sm">Género</label>
                <p class="text-white text-lg">{{ user()?.genero }}</p>
              </div>
            }

            @if (user()?.telefono) {
              <div>
                <label class="text-slate-400 text-sm">Teléfono</label>
                <p class="text-white text-lg">{{ user()?.telefono }}</p>
              </div>
            }

            @if (user()?.sangre) {
              <div>
                <label class="text-slate-400 text-sm">Tipo de Sangre</label>
                <p class="text-white text-lg">{{ user()?.sangre }}</p>
              </div>
            }

            @if (user()?.residencia) {
              <div>
                <label class="text-slate-400 text-sm">Residencia</label>
                <p class="text-white text-lg">{{ user()?.residencia }}</p>
              </div>
            }

            @if (user()?.pais) {
              <div>
                <label class="text-slate-400 text-sm">País</label>
                <p class="text-white text-lg">{{ user()?.pais }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
}
