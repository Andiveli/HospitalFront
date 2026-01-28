import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ==========================================
  // Rutas Públicas - Auth Module
  // ==========================================
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Login - Hospital App'
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Registro - Hospital App'
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Recuperar Contraseña - Hospital App'
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // ==========================================
  // Debug Route (Public - for testing)
  // ==========================================
  {
    path: 'debug',
    loadComponent: () => import('./features/debug/debug.component'),
    title: 'Debug - Hospital App'
  },
  
  // ==========================================
  // Rutas Protegidas - Con Layout de Paciente
  // ==========================================
  {
    path: '',
    loadComponent: () => import('./features/shared/layouts/patient-layout.component').then(m => m.PatientLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Inicio - Hospital App'
      },
      {
        path: 'citas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/citas/lista/lista-citas.component'),
            title: 'Mis Citas - Hospital App'
          },
          {
            path: 'agendar',
            loadComponent: () => import('./features/citas/agendar/agendar-cita.component'),
            title: 'Agendar Cita - Hospital App'
          },
          {
            path: ':id',
            loadComponent: () => import('./features/citas/detalle/detalle-cita.component'),
            title: 'Detalle de Cita - Hospital App'
          }
        ]
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Mi Perfil - Hospital App'
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Ajustes - Hospital App'
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // ==========================================
  // Redirecciones por defecto
  // ==========================================
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
