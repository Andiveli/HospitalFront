import type { Routes } from '@angular/router';
import { adminGuard, authGuard, doctorGuard, patientGuard } from './core/guards/auth.guard';

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
        path: 'confirmar/:token',
        loadComponent: () =>
          import('./features/auth/confirm-email/confirm-email.component').then(
            (m) => m.ConfirmEmailComponent
          ),
        title: 'Confirmar Email - Hospital App',
      },
      {
        path: 'reset-password/:token',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        title: 'Restablecer Contraseña - Hospital App',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // ==========================================
  // Rutas Públicas - Acceso Invitado a Videollamada
  // ==========================================
  {
    path: 'invitado/:code',
    loadComponent: () =>
      import('./features/video-call/sala-espera-invitado/sala-espera-invitado.component').then(
        (m) => m.SalaEsperaInvitadoComponent
      ),
    title: 'Sala de Espera - Invitado',
  },
  {
    path: 'videollamada/invitado/:code',
    loadComponent: () =>
      import('./features/video-call/sala-espera-invitado/sala-espera-invitado.component').then(
        (m) => m.SalaEsperaInvitadoComponent
      ),
    title: 'Sala de Espera - Invitado',
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
  // Rutas Protegidas - Con Layout de Admin (Mayor prioridad)
  // ==========================================
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        title: 'Dashboard - Panel Admin',
      },
      {
        path: 'medicos',
        loadComponent: () =>
          import('./features/admin/medicos/admin-medicos.component').then(
            (m) => m.AdminMedicosComponent
          ),
        title: 'Médicos - Panel Admin',
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./features/admin/pacientes/admin-pacientes.component').then(
            (m) => m.AdminPacientesComponent
          ),
        title: 'Pacientes - Panel Admin',
      },
      {
        path: 'citas',
        loadComponent: () =>
          import('./features/admin/citas/admin-citas.component').then((m) => m.AdminCitasComponent),
        title: 'Citas - Panel Admin',
      },
      {
        path: 'medicamentos',
        loadComponent: () =>
          import('./features/admin/medicamentos/admin-medicamentos.component').then(
            (m) => m.AdminMedicamentosComponent
          ),
        title: 'Medicamentos - Panel Admin',
      },
      {
        path: 'otros',
        loadComponent: () =>
          import('./features/admin/otros/admin-otros.component').then((m) => m.AdminOtrosComponent),
        title: 'Otros - Panel Admin',
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ==========================================
  // Rutas Protegidas - Con Layout de Médico (Prioridad sobre paciente)
  // ==========================================
  {
    path: '',
    loadComponent: () =>
      import('./features/shared/layout-medico/doctor-layout.component').then(
        (m) => m.DoctorLayoutComponent
      ),
    canActivate: [authGuard, doctorGuard],
    children: [
      {
        path: 'doctor/dashboard',
        loadComponent: () =>
          import('./features/medico/dashboard/medico-dashboard.component').then(
            (m) => m.MedicoDashboardComponent
          ),
        title: 'Inicio - Portal Médico',
      },
      {
        path: 'citas/medico',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/medico/mis-consultas/mis-consultas.component').then(
                (m) => m.MisConsultasComponent
              ),
            title: 'Mis Consultas - Portal Médico',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/pacientes/citas/detalle/detalle-cita.component').then(
                (m) => m.default
              ),
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
        path: 'doctor/excepciones-horario',
        loadComponent: () =>
          import('./features/medico/excepciones-horario/excepciones-horario.component').then(
            (m) => m.ExcepcionesHorarioComponent
          ),
        title: 'Excepciones de Horario - Portal Médico',
      },
      {
        path: 'doctor/historia-clinica/:pacienteId',
        loadComponent: () =>
          import('./features/pacientes/historia-clinica/historia-clinica.component').then(
            (m) => m.HistoriaClinicaComponent
          ),
        title: 'Historia Clínica del Paciente - Portal Médico',
      },
      {
        path: 'doctor/ajustes',
        loadComponent: () =>
          import('./features/shared/ajustes/ajustes.component').then((m) => m.AjustesComponent),
        title: 'Ajustes - Portal Médico',
      },
      // Panel de consulta para médico (antes de iniciar)
      {
        path: 'doctor/consulta/:id',
        loadComponent: () =>
          import(
            './features/video-call/panel-consulta-medico/panel-consulta-medico.component'
          ).then((m) => m.PanelConsultaMedicoComponent),
        title: 'Panel de Consulta - Portal Médico',
      },
      // Sala de videollamada para médico
      {
        path: 'doctor/videollamada/:id',
        loadComponent: () =>
          import('./features/video-call/sala-videollamada/sala-videollamada.component').then(
            (m) => m.SalaVideollamadaComponent
          ),
        title: 'Videollamada - Portal Médico',
      },
      // Registro de atención médica (post-sesión)
      {
        path: 'doctor/registro-atencion/:id',
        loadComponent: () =>
          import('./features/medico/registro-atencion/registro-atencion.component').then(
            (m) => m.RegistroAtencionComponent
          ),
        title: 'Registro de Atención - Portal Médico',
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
      import('./features/shared/layout-paciente/patient-layout.component').then(
        (m) => m.PatientLayoutComponent
      ),
    canActivate: [authGuard, patientGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/pacientes/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        title: 'Inicio - Hospital App',
      },
      {
        path: 'citas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/pacientes/citas/lista/lista-citas.component'),
            title: 'Mis Citas - Hospital App',
          },
          {
            path: 'agendar',
            loadComponent: () =>
              import('./features/pacientes/citas/agendar/agendar-cita.component'),
            title: 'Agendar Cita - Hospital App',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/pacientes/citas/detalle/detalle-cita.component').then(
                (m) => m.default
              ),
            title: 'Detalle de Cita - Hospital App',
          },
        ],
      },
      // Sala de espera para paciente
      {
        path: 'sala-espera/:id',
        loadComponent: () =>
          import('./features/video-call/sala-espera-paciente/sala-espera-paciente.component').then(
            (m) => m.SalaEsperaPacienteComponent
          ),
        title: 'Sala de Espera - Hospital App',
      },
      // Sala de videollamada para paciente
      {
        path: 'videollamada/:id',
        loadComponent: () =>
          import('./features/video-call/sala-videollamada/sala-videollamada.component').then(
            (m) => m.SalaVideollamadaComponent
          ),
        title: 'Videollamada - Hospital App',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/pacientes/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'Mi Perfil - Hospital App',
      },
      {
        path: 'documentos',
        loadComponent: () =>
          import('./features/pacientes/documents/documents.component').then(
            (m) => m.DocumentsComponent
          ),
        title: 'Mis Documentos - Hospital App',
      },
      {
        path: 'recetas',
        loadComponent: () =>
          import('./features/pacientes/recetas/recetas.component').then((m) => m.RecetasComponent),
        title: 'Mis Recetas - Hospital App',
      },
      {
        path: 'historia-clinica',
        loadComponent: () =>
          import('./features/pacientes/historia-clinica/historia-clinica.component').then(
            (m) => m.HistoriaClinicaComponent
          ),
        title: 'Historia Clínica - Hospital App',
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./features/shared/ajustes/ajustes.component').then((m) => m.AjustesComponent),
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
