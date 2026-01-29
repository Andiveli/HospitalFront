import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MedicosService } from '../../core/services/medicos.service';

@Component({
  selector: 'app-debug',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-slate-900 mb-8">🔍 Debug Panel</h1>

        <!-- Auth Status -->
        <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-4">Authentication Status</h2>
          <div class="space-y-2 font-mono text-sm">
            <div class="flex gap-2">
              <span class="text-slate-600 min-w-[180px]">Token Signal:</span>
              <span class="text-blue-600">{{ authService.token() ? '✅ Present' : '❌ Missing' }}</span>
            </div>
            @if (authService.token()) {
              <div class="flex gap-2">
                <span class="text-slate-600 min-w-[180px]">Token (first 40):</span>
                <span class="text-xs text-slate-500 break-all">{{ authService.token()!.substring(0, 40) }}...</span>
              </div>
            }
            <div class="flex gap-2">
              <span class="text-slate-600 min-w-[180px]">User Signal:</span>
              <span class="text-blue-600">{{ authService.user() ? '✅ Loaded' : '❌ null' }}</span>
            </div>
            @if (authService.user()) {
              <div class="ml-[180px] mt-2 p-3 bg-slate-50 rounded border border-slate-200">
                <div class="text-xs space-y-1">
                  <div><strong>ID:</strong> {{ authService.user()!.id }}</div>
                  <div><strong>Email:</strong> {{ authService.user()!.email }}</div>
                  <div><strong>nombreCompleto:</strong> {{ authService.user()!.nombreCompleto }}</div>
                  <div><strong>Roles:</strong> {{ authService.user()!.roles.join(', ') }}</div>
                  @if (authService.user()!.edad) {
                    <div><strong>Edad:</strong> {{ authService.user()!.edad }}</div>
                  }
                  @if (authService.user()!.genero) {
                    <div><strong>Género:</strong> {{ authService.user()!.genero }}</div>
                  }
                  @if (authService.user()!.telefono) {
                    <div><strong>Teléfono:</strong> {{ authService.user()!.telefono }}</div>
                  }
                </div>
              </div>
            }
            <div class="flex gap-2 mt-4 pt-4 border-t border-slate-200">
              <span class="text-slate-600 min-w-[180px]">isAuthenticated():</span>
              <span [class]="authService.isAuthenticated() ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                {{ authService.isAuthenticated() ? '✅ TRUE' : '❌ FALSE' }}
              </span>
            </div>
            <div class="flex gap-2">
              <span class="text-slate-600 min-w-[180px]">Computed Logic:</span>
              <span class="text-xs text-slate-500">
                token={{ !!authService.token() }} AND user={{ !!authService.user() }} = {{ !!authService.token() && !!authService.user() }}
              </span>
            </div>
          </div>

          <!-- Reload Profile Button -->
          <div class="mt-4 pt-4 border-t border-slate-200">
            <button
              (click)="reloadProfile()"
              [disabled]="loadingReload()"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300"
            >
              @if (loadingReload()) {
                <span>Recargando...</span>
              } @else {
                <span>🔄 Recargar Perfil Manualmente</span>
              }
            </button>
            @if (reloadResult()) {
              <p class="mt-2 text-sm" [class.text-green-600]="reloadResult()!.includes('✅')" [class.text-red-600]="reloadResult()!.includes('❌')">
                {{ reloadResult() }}
              </p>
            }
          </div>
        </div>

        <!-- Test Endpoints -->
        <div class="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-4">Test Endpoints</h2>
          
          <div class="space-y-4">
            <!-- Test Medicos -->
            <div>
              <button
                (click)="testMedicos()"
                [disabled]="loadingMedicos()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
              >
                @if (loadingMedicos()) {
                  <span>Testing...</span>
                } @else {
                  <span>Test GET /citas/medicos</span>
                }
              </button>

              @if (medicosResult()) {
                <div class="mt-2 p-3 bg-slate-50 rounded border border-slate-200">
                  <pre class="text-xs overflow-auto">{{ medicosResult() }}</pre>
                </div>
              }
            </div>

            <!-- Test Profile -->
            <div>
              <button
                (click)="testProfile()"
                [disabled]="loadingProfile()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300"
              >
                @if (loadingProfile()) {
                  <span>Testing...</span>
                } @else {
                  <span>Test GET /auth/perfil</span>
                }
              </button>

              @if (profileResult()) {
                <div class="mt-2 p-3 bg-slate-50 rounded border border-slate-200">
                  <pre class="text-xs overflow-auto">{{ profileResult() }}</pre>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4">
          <button
            (click)="goToLogin()"
            class="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Go to Login
          </button>
          <button
            (click)="goToAgendarCita()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Agendar Cita
          </button>
          <button
            (click)="goToDashboard()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
})
export default class DebugComponent {
  readonly authService = inject(AuthService);
  private readonly medicosService = inject(MedicosService);
  private readonly router = inject(Router);

  loadingMedicos = signal(false);
  medicosResult = signal<string | null>(null);

  loadingProfile = signal(false);
  profileResult = signal<string | null>(null);

  loadingReload = signal(false);
  reloadResult = signal<string | null>(null);

  getUserJson(): string {
    return JSON.stringify(this.authService.user(), null, 2);
  }

  async reloadProfile(): Promise<void> {
    this.loadingReload.set(true);
    this.reloadResult.set(null);
    try {
      await this.authService.loadUserProfile();
      this.reloadResult.set(
        '✅ Perfil recargado. isAuthenticated: ' + this.authService.isAuthenticated()
      );
    } catch (error: any) {
      this.reloadResult.set('❌ Error: ' + (error?.message || 'Unknown'));
    } finally {
      this.loadingReload.set(false);
    }
  }

  async testMedicos(): Promise<void> {
    this.loadingMedicos.set(true);
    this.medicosResult.set(null);
    try {
      const result = await this.medicosService.getMedicos();
      this.medicosResult.set(JSON.stringify(result, null, 2));
    } catch (error: any) {
      this.medicosResult.set(`❌ ERROR:\n${JSON.stringify(error, null, 2)}`);
    } finally {
      this.loadingMedicos.set(false);
    }
  }

  async testProfile(): Promise<void> {
    this.loadingProfile.set(true);
    this.profileResult.set(null);
    try {
      await this.authService.loadUserProfile();
      this.profileResult.set('✅ Profile loaded successfully');
    } catch (error: any) {
      this.profileResult.set(`❌ ERROR:\n${JSON.stringify(error, null, 2)}`);
    } finally {
      this.loadingProfile.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToAgendarCita(): void {
    this.router.navigate(['/citas/agendar']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
