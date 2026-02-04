import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-otros',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Otras Configuraciones</h1>
        <p class="text-slate-600 mt-1">Configuraciones adicionales del sistema</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Especialidades -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition cursor-pointer">
          <div class="w-12 h-12 mb-4 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-1">Especialidades</h3>
          <p class="text-sm text-slate-500">Gestionar especialidades médicas</p>
        </div>

        <!-- Enfermedades -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition cursor-pointer">
          <div class="w-12 h-12 mb-4 rounded-xl bg-red-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-1">Enfermedades</h3>
          <p class="text-sm text-slate-500">Catálogo de enfermedades</p>
        </div>

        <!-- Reportes -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition cursor-pointer">
          <div class="w-12 h-12 mb-4 rounded-xl bg-cyan-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-1">Reportes</h3>
          <p class="text-sm text-slate-500">Generar reportes del sistema</p>
        </div>

        <!-- Configuración -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition cursor-pointer">
          <div class="w-12 h-12 mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-1">Configuración</h3>
          <p class="text-sm text-slate-500">Ajustes generales del sistema</p>
        </div>

        <!-- Auditoría -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition cursor-pointer">
          <div class="w-12 h-12 mb-4 rounded-xl bg-orange-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-1">Auditoría</h3>
          <p class="text-sm text-slate-500">Logs y actividad del sistema</p>
        </div>

        <!-- Usuarios -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-md transition cursor-pointer">
          <div class="w-12 h-12 mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-900 mb-1">Usuarios</h3>
          <p class="text-sm text-slate-500">Gestión de cuentas y permisos</p>
        </div>
      </div>

      <div class="mt-8">
        <a routerLink="/admin/dashboard" class="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-purple-600 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Dashboard
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOtrosComponent {}
