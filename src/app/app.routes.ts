import type { Routes } from '@angular/router';
import { authGuard, doctorGuard, patientGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ==========================================
  // Rutas Públicas - Auth Module
  // ==========================================
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
        title: 'Login - Hospital App',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
        title: 'Registro - Hospital App',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
        title: 'Recuperar Contraseña - Hospital App',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // ==========================================
  // Debug Route (Public - for testing)
  // ==========================================
  {
    path: 'debug',
    loadComponent: () => import('./features/debug/debug.component'),
    title: 'Debug - Hospital App',
  },

  // ==========================================
  // Rutas Protegidas - Con Layout de Médico (Prioridad sobre paciente)
  // ==========================================
  {
    path: '',
    loadComponent: () =>
      import('./features/shared/layouts/doctor-layout.component').then(
        (m) => m.DoctorLayoutComponent
      ),
    canActivate: [authGuard, doctorGuard],
    children: [
      {
        path: 'doctor/dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Inicio - Portal Médico',
      },
      {
        path: 'doctor/consultas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/citas/lista/lista-citas.component'),
            title: 'Mis Consultas - Portal Médico',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/citas/detalle/detalle-cita.component').then((m) => m.default),
            title: 'Detalle de Consulta - Portal Médico',
          },
        ],
      },
      {
        path: 'doctor/profile',
        loadComponent: () =>
          import('./features/medico/perfil-profesional/perfil-profesional.component').then(
            (m) => m.PerfilProfesionalComponent
          ),
        title: 'Perfil Profesional - Portal Médico',
      },
      {
        path: 'doctor/ajustes',
        loadComponent: () =>
          import('./features/ajustes/ajustes.component').then((m) => m.AjustesComponent),
        title: 'Ajustes - Portal Médico',
      },
      {
        path: 'sala-espera/:id',
        loadComponent: () =>
          import('./features/video-call/sala-espera-paciente/sala-espera-paciente.component').then(
            (m) => m.SalaEsperaPacienteComponent
          ),
        title: 'Sala de Espera - Portal Médico',
      },
      {
        path: 'sala-espera-invitado/:code',
        loadComponent: () =>
          import('./features/video-call/sala-espera-invitado/sala-espera-invitado.component').then(
            (m) => m.SalaEsperaInvitadoComponent
          ),
        title: 'Sala de Espera Invitado - Portal Médico',
      },
      {
        path: '',
        redirectTo: 'doctor/dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ==========================================
  // Rutas Protegidas - Con Layout de Paciente (Fallback)
  // ==========================================
  {
    path: '',
    loadComponent: () =>
      import('./features/shared/layouts/patient-layout.component').then(
        (m) => m.PatientLayoutComponent
      ),
    canActivate: [authGuard, patientGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Inicio - Hospital App',
      },
      {
        path: 'citas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/citas/lista/lista-citas.component'),
            title: 'Mis Citas - Hospital App',
          },
          {
            path: 'agendar',
            loadComponent: () => import('./features/citas/agendar/agendar-cita.component'),
            title: 'Agendar Cita - Hospital App',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/citas/detalle/detalle-cita.component').then((m) => m.default),
            title: 'Detalle de Cita - Hospital App',
          },
        ],
      },
      {
        path: 'sala-espera/:id',
        loadComponent: () =>
          import('./features/video-call/sala-espera-paciente/sala-espera-paciente.component').then(
            (m) => m.SalaEsperaPacienteComponent
          ),
        title: 'Sala de Espera - Hospital App',
      },
      {
        path: 'sala-espera-invitado/:code',
        loadComponent: () =>
          import('./features/video-call/sala-espera-invitado/sala-espera-invitado.component').then(
            (m) => m.SalaEsperaInvitadoComponent
          ),
        title: 'Sala de Espera Invitado - Hospital App',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Mi Perfil - Hospital App',
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./features/ajustes/ajustes.component').then((m) => m.AjustesComponent),
        title: 'Ajustes - Hospital App',
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ==========================================
  // Redirecciones por defecto
  // ==========================================
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
