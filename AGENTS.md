# 🏥 Hospital Frontend - Agent Specifications

## 📋 **Project Overview**

**Backend API:** `http://localhost:3000/api-json` (Swagger Documentation)
**UI Framework:** Tailwind CSS v4 (following best practices)
**Target Users:** Pacientes, Médicos y Administradores
**Authentication Flow:** 
- Pacientes: Login → Dashboard Paciente → Perfil/Historial/Citas
- Médicos: Login → Dashboard Médico → Perfil Profesional → Mis Consultas
- Administradores: Login → Dashboard Admin → Gestión del Sistema

**Core Features:** 
- ✅ Gestión de pacientes completa
- ✅ Gestión de médicos y sus perfiles profesionales
- ✅ Sistema de reserva y atención de citas virtuales
- ✅ Panel de administración (medicamentos, especialidades, enfermedades, configuración)
- 🚧 Reportes y estadísticas
- 🚧 Auditoría del sistema
- 🚧 Gestión de usuarios

---

## 🎯 **User Journeys**

### **Paciente Journey (COMPLETADO)**
```
Página de Login (pública)
      ↓ (autenticación)
Dashboard Paciente (protegido)
      ↓
Gestión de Perfil Paciente (protegido)
      ↓
Historial Médico y Documentos (protegido)
      ↓
Reserva de Citas (protegido)
```

### **Médico Journey (COMPLETADO)**
```
Página de Login (pública)
      ↓ (autenticación como médico)
Dashboard Médico (protegido)
      ↓
Perfil Profesional (protegido)
      ↓
Mis Consultas (protegido)
      ↓
Atender Cita Virtual (protegido)
```

### **Administrador Journey (COMPLETADO)**
```
Página de Login (pública)
      ↓ (autenticación como admin)
Dashboard Admin (protegido)
      ↓
Gestión de Médicos y Pacientes
      ↓
Gestión de Citas, Medicamentos, Especialidades, Enfermedades
      ↓
Configuración del Sistema, Reportes, Auditoría, Usuarios
```

---

## 🔐 **Authentication Strategy**

### **User Roles**
- `role: 'PACIENTE'` - Acceso a funcionalidades de paciente
- `role: 'MEDICO'` - Acceso a funcionalidades de médico
- `role: 'ADMIN'` - Acceso administrativo

### **Endpoints Públicos:**

- `POST /auth/login` - Login (detecta rol automáticamente)
- `POST /auth/register` - Registro (paciente o médico)
- `GET /auth/confirmar/{token}` - Confirmar email
- `POST /auth/olvide-password` - Recuperar contraseña
- `GET /auth/recuperar-password/{token}` - Verificar token
- `POST /auth/recuperar-password/{token}` - Restablecer contraseña

### **Endpoints Protegidos - Pacientes (JWT Required):**

- `GET /auth/perfil` - Obtener perfil
- `POST /auth/cambiarPass` - Cambiar contraseña
- `POST /pacientes/addInfo` - Agregar información personal
- `GET /pacientes/myInfo` - Obtener información del paciente
- `POST /pacientes/addDocs` - Agregar documentos médicos
- Todos los endpoints de gestión de historia clínica
- Endpoints de reserva de citas

### **Endpoints Protegidos - Médicos (JWT Required):**

- `GET /auth/perfil` - Obtener perfil completo (incluye datos profesionales y horarios si es médico)
- `POST /auth/cambiarPass` - Cambiar contraseña
- `GET /medicos/consultas` - Listar consultas asignadas
- `GET /medicos/consultas/{id}` - Detalle de consulta
- `POST /medicos/consultas/{id}/atender` - Iniciar atención virtual
- `POST /medicos/excepciones-horario` - Crear excepción de horario
- `GET /medicos/excepciones-horario` - Listar excepciones

### **Endpoints Protegidos - Administradores (JWT Required):**

- Todos los endpoints de gestión (médicos, pacientes, citas, medicamentos, etc.)
- Endpoints de configuración del sistema
- Endpoints de reportes y estadísticas
- Endpoints de auditoría
- Endpoints de gestión de usuarios

### **Security Implementation:**

- HTTP Client Interceptor para añadir `Bearer {token}` a requests protegidos
- Role-based Auth Guards (`pacienteGuard`, `medicoGuard`, `adminGuard`)
- Token storage en localStorage con signals
- Token refresh strategy
- Redirección basada en rol post-login

---

## 🗂️ **Feature Modules & Documentation Sources**

### **1. Authentication Module** 🔐 (COMPLETADO)

**Backend Docs:** `/auth/*` endpoints
**Components:**

- Login page (`/auth/login`) - Detecta rol y redirige
- Register page (`/auth/register`)
- Forgot password (`/auth/forgot`)
- Reset password (`/auth/reset`)
- Confirm email (`/auth/confirmar/:token`)

**Key DTOs:**

```typescript
// Login
- LoginDto { email, password }
- AuthResponseDto { message, data: { token, user: { id, email, role, nombreCompleto } } }

// Registro Paciente
- SignupPacienteDto { cedula, nombres, email, password, genero }

// Registro Médico  
- SignupMedicoDto { cedula, nombres, email, password, genero, especialidadId, telefono }

// Perfil Base
- PerfilResponseDto { id, cedula, nombreCompleto, email, verificado, genero, role, createdAt }
```

### **2. Patient Module** 👤 (COMPLETADO)

**Backend Docs:** `/auth/perfil`, `/pacientes/*`
**Components:**

- Patient Dashboard (`/paciente/dashboard`)
- Patient Profile (`/paciente/perfil`)
- Personal Information Form
- Medical History Overview
- Document Gallery
- Appointment Booking

**Key DTOs:**

```typescript
- InfoDto (estructura específica del backend)
- PerfilResponseDto
- MensajeResponseDto
- DocumentResponseDto { id, titulo, mimeType, fechaHoraSubida }
```

### **3. Doctor Module** 👨‍⚕️ (COMPLETADO)

**Backend Docs:** `/medicos/*`, `/auth/perfil`
**Components:**

- Doctor Dashboard (`/doctor/dashboard`)
- Professional Profile (`/doctor/profile`)
- Work Schedule Display (`/doctor/profile`)
- Exception Schedule Manager (`/doctor/excepciones-horario`)
- My Appointments (`/citas/medico`)
- Virtual Appointment Room (`/doctor/consulta/:id`)
- Video Call (`/doctor/videollamada/:id`)
- Medical Record (`/doctor/registro-atencion/:id`)
- Settings (`/doctor/ajustes`)

**Key DTOs:**

```typescript
// Perfil Profesional del Médico
- MedicoPerfilDto {
    id: number;
    cedula: string;
    nombres: string;
    email: string;
    telefono: string;
    fechaNacimiento?: Date;
    genero: 'MASCULINO' | 'FEMENINO' | 'OTRO';
    especialidad: EspecialidadDto;
    subespecialidad?: string;
    numeroRegistroProfesional: string;
    biografia?: string;
    fotoPerfil?: string;
    aniosExperiencia: number;
    consultasAtendidas: number;
    calificacionPromedio: number;
    verificado: boolean;
    createdAt: Date;
  }

- EspecialidadDto {
    id: number;
    nombre: string;
    descripcion?: string;
  }

// Horarios de Atención
- HorarioAtencionDto {
    id: number;
    diaSemana: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
    horaInicioManana?: string;
    horaFinManana?: string;
    horaInicioTarde?: string;
    horaFinTarde?: string;
    activo: boolean;
  }

// Excepciones de Horario
- ExcepcionHorarioDto {
    id: number;
    medicoId: number;
    fecha: string;
    horaInicio?: string;
    horaFin?: string;
    diaCompleto: boolean;
    motivo?: string;
    createdAt: Date;
  }

- CreateExcepcionDto {
    fecha: string;
    horaInicio?: string;
    horaFin?: string;
    motivo?: string;
  }

// Consultas
- ConsultaMedicaDto {
    id: number;
    paciente: PacienteResumenDto;
    fecha: Date;
    horaInicio: string;
    horaFin?: string;
    estado: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
    tipo: 'VIRTUAL' | 'PRESENCIAL';
    motivo: string;
    notasMedicas?: string;
  }

- PacienteResumenDto {
    id: number;
    nombres: string;
    edad: number;
    genero: string;
  }
```

### **4. Medical History Module** 📋 (COMPLETADO)

**Backend Docs:** `/paciente-enfermedad/*`, `/enfermedades/*`, `/tipo-enfermedad/*`
**Components:**

- Admin Diseases List (`/admin/enfermedades`)
- Disease Create/Edit Forms
- Medical Conditions List
- Disease Details View

**Key DTOs:**

```typescript
- CreatePacienteEnfermedadDto
- UpdatePacienteEnfermedadDto
- EnfermedadDto { id, nombre, tipoEnfermedadId }
- TipoEnfermedadDto { id, nombre }
```

### **5. Documents Module** 📄 (COMPLETADO)

**Backend Docs:** `/documents/*`
**Components:**

- Document Upload
- Document Gallery
- Document Viewer
- Document Download

**Key DTOs:**

```typescript
- DocumentResponseDto { id, titulo, mimeType, fechaHoraSubida }
- Tipos de documento disponibles
- File upload constraints (max 10MB, PDF/JPEG/PNG/GIF/WebP)
```

### **6. Appointments Module** 📅 (COMPLETADO)

**Backend Docs:** `/citas/*`
**Components:**

- Appointment Calendar (paciente)
- Available Slots View (paciente)
- My Appointments List (paciente y médico)
- Virtual Room (médico y paciente)
- Admin Citas Management (`/admin/citas`)

### **7. Admin Module - Medications** 💊 (COMPLETADO)

**Backend Docs:** `/medicamentos/*`
**Components:**

- Admin Medications List (`/admin/medicamentos`)
- Medication Create/Edit Forms

### **8. Admin Module - Specialties** 🏥 (COMPLETADO)

**Backend Docs:** `/especialidades/*`
**Components:**

- Admin Specialties List (`/admin/especialidades`)
- Specialty Create/Edit Forms

### **9. Admin Module - Configuration** ⚙️ (COMPLETADO)

**Backend Docs:** `/configuracion/*` (pendiente de implementar en backend)
**Components:**

- Admin Configuration (`/admin/configuracion`)
  - ⏰ Horarios del hospital por día
  - 📅 Configuración de citas (duración, máximo por día, anticipación)
  - 🔔 Notificaciones (email, SMS, tiempo de recordatorio)
  - 🎉 Días Festivos (agregar/eliminar)

**Key DTOs:**

```typescript
// Configuración del Sistema
- ConfiguracionHospital {
    horarios: HorarioHospital[];
    duracionCitaMinutos: number;
    maxCitasPorDia: number;
    diasAnticipacionAgendar: number;
    permitirCitasTelefonicas: boolean;
    notificacionesEmail: boolean;
    notificacionesSMS: boolean;
    tiempoRecordatorioHoras: number;
  }

- HorarioHospital {
    diaSemana: number; // 0 = Domingo, 1 = Lunes, etc.
    abierto: boolean;
    horaApertura?: string;
    horaCierre?: string;
  }

- DiaFestivo {
    id: string;
    fecha: string;
    descripcion: string;
  }
```

### **10. Admin Module - Reports** 📊 (PENDIENTE)

**Backend Docs:** `/reportes/*` (pendiente de implementar en backend)
**Components:**

- Admin Reports Dashboard (`/admin/reportes`)
  - 📈 Estadísticas de citas por mes
  - 📊 Citas por médico
  - 📊 Citas por especialidad
  - 📉 Citas canceladas vs atendidas
  - 📥 Exportar datos a CSV
  - 📊 Gráficos simples de barras

**Key DTOs:**

```typescript
// Reportes
- ReporteEstadisticoDto {
    periodo: { inicio: Date; fin: Date };
    totalCitas: number;
    citasAtendidas: number;
    citasCanceladas: number;
    citasPendientes: number;
    promedioCitasPorDia: number;
    citasPorMes: { mes: string; cantidad: number }[];
    citasPorMedico: { medico: string; cantidad: number }[];
    citasPorEspecialidad: { especialidad: string; cantidad: number }[];
  }

- FiltroReporteDto {
    fechaInicio: string;
    fechaFin: string;
    medicoId?: number;
    especialidadId?: number;
    tipo?: 'VIRTUAL' | 'PRESENCIAL';
  }
```

### **11. Admin Module - Audit** 📋 (PENDIENTE)

**Backend Docs:** `/auditoria/*` (pendiente de implementar en backend)
**Components:**

- Admin Audit Log (`/admin/auditoria`)
  - 📝 Registro de actividad
  - 👤 Quién hizo qué y cuándo
  - 🔐 Login/logout de usuarios
  - 📝 Cambios en citas
  - 🔍 Filtros por usuario, acción, fecha

**Key DTOs:**

```typescript
// Auditoría
- LogAuditoriaDto {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    accion: string;
    entidad: string;
    entidadId?: number;
    detalles?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
  }

- FiltroAuditoriaDto {
    fechaInicio?: string;
    fechaFin?: string;
    usuarioId?: number;
    accion?: string;
    entidad?: string;
  }
```

### **12. Admin Module - Users** 👥 (PENDIENTE)

**Backend Docs:** `/usuarios/*` (pendiente de implementar en backend)
**Components:**

- Admin Users List (`/admin/usuarios`)
  - 👥 Listar todos los usuarios (pacientes, médicos, admins)
  - 🔐 Activar/desactivar cuentas
  - 🔑 Resetear contraseñas
  - 👁️ Ver último acceso

**Key DTOs:**

```typescript
// Usuarios
- UsuarioDto {
    id: number;
    email: string;
    nombreCompleto: string;
    cedula: string;
    role: 'PACIENTE' | 'MEDICO' | 'ADMIN';
    activo: boolean;
    ultimoAcceso?: Date;
    creadoEn: Date;
  }

- UpdateUsuarioDto {
    activo?: boolean;
    role?: 'PACIENTE' | 'MEDICO' | 'ADMIN';
  }

- ResetPasswordDto {
    userId: number;
    nuevaPassword: string;
  }
```

---

## 🎨 **Tailwind CSS 4 Implementation Guidelines**

### **Colors & Theming:**

```scss
// Design System Colors (definir en styles.scss)
:root {
  --color-primary: #3b82f6; // blue-500
  --color-secondary: #64748b; // slate-500
  --color-success: #10b981; // emerald-500
  --color-warning: #f59e0b; // amber-500
  --color-error: #ef4444; // red-500
  --color-surface: #ffffff; // white
  --color-surface-dark: #0f172a; // slate-900
}
```

### **Component Patterns:**

- **Forms:** Tailwind + Angular Reactive Forms
- **Cards:** `@defer` para lazy loading de contenido pesado
- **Modals:** Native dialog element con Tailwind
- **Navigation:** Signals para active state
- **Data Tables:** Virtual scrolling para listas grandes
- **Avatar/Profile Images:** NgOptimizedImage con placeholders
- **Charts:** Simple CSS-based bar charts for reports

### **Utility Usage:**

- **Conditional classes:** Use `cn()` utility for dynamic classes
- **NEVER** use `var()` in className - use Tailwind semantic classes
- **NEVER** use hex colors - use Tailwind color palette
- **Dynamic values:** Use `style` prop when needed

---

## 🛠️ **Technical Implementation Details**

### **Angular Architecture (2025 Best Practices):**

- **Zoneless:** `provideZonelessChangeDetection()`
- **Standalone Components:** Todos los componentes standalone
- **Signals:** Para estado local y computed properties
- **Change Detection:** `OnPush` para todos los componentes
- **Inject:** Function-based dependency injection
- **Control Flow:** `@if`, `@for`, `@switch` (no *ngIf,*ngFor)

### **File Structure:**

```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.ts                 # Auth service con role detection
│   │   ├── api.ts                  # Base API service
│   │   ├── storage.ts              # LocalStorage service
│   │   ├── configuracion.service.ts # Configuración del sistema (localStorage)
│   │   └── excepciones-horario.service.ts
│   ├── interceptors/
│   │   └── auth.ts                 # JWT interceptor
│   ├── guards/
│   │   ├── auth.ts                 # General auth guard
│   │   ├── paciente.ts             # Paciente role guard
│   │   ├── medico.ts               # Medico role guard
│   │   └── admin.ts                # Admin role guard
│   └── models/
│       └── index.ts                # Type definitions
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── confirm-email/
│   │   └── reset-password/
│   ├── paciente/                   # ✅ COMPLETADO
│   │   ├── dashboard/
│   │   ├── perfil/
│   │   ├── historial-medico/
│   │   ├── documentos/
│   │   └── citas/
│   ├── medico/                     # ✅ COMPLETADO
│   │   ├── dashboard/
│   │   ├── perfil-profesional/
│   │   ├── excepciones-horario/
│   │   ├── mis-consultas/
│   │   ├── registro-atencion/
│   │   ├── ajustes/
│   │   └── video-call/
│   ├── admin/                      # ✅ COMPLETADO (parcial)
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── pacientes/
│   │   ├── medicos/
│   │   ├── citas/
│   │   ├── medicamentos/
│   │   ├── especialidades/
│   │   ├── enfermedades/
│   │   ├── configuracion/          # ✅ NUEVO
│   │   ├── reportes/               # 🚧 PENDIENTE
│   │   ├── auditoria/              # 🚧 PENDIENTE
│   │   ├── usuarios/               # 🚧 PENDIENTE
│   │   └── otros/
│   ├── shared/
│   │   ├── layout-medico/
│   │   ├── layout-paciente/
│   │   ├── ajustes/
│   │   └── video-call/
│   └── debug/
├── app.ts
├── app.config.ts
└── app.routes.ts
```

### **State Management:**

- **Auth state:** Signals para user, token, isAuthenticated, userRole
- **Component state:** Signals para forms y UI state
- **Role-based routing:** Redirección automática según rol
- **No NgRx/Pinia:** Signals suffice for this scope

### **Error Handling:**

- Global error handler
- User-friendly error messages
- Network error recovery
- Form validation with Angular Reactive Forms
- Role-based access error handling

---

## 📝 **Development Checklist**

### **Phase 1: Foundation (COMPLETADO ✅)**

- [x] Set up Tailwind CSS 4 configuration
- [x] Create type definitions for all DTOs
- [x] Implement auth service with token management
- [x] Set up HTTP interceptor for JWT
- [x] Create auth guard
- [x] Configure routes (public vs protected)

### **Phase 2: Authentication (COMPLETADO ✅)**

- [x] Login page component con role detection
- [x] Register page component (paciente y médico)
- [x] Forgot/Reset password flow
- [x] Form validation and error handling
- [x] Redirect after successful login basado en rol

### **Phase 3: Patient Module (COMPLETADO ✅)**

- [x] Patient Dashboard layout
- [x] Patient Profile section
- [x] Personal Information Form
- [x] Medical history overview
- [x] Document upload and gallery
- [x] Password change functionality

### **Phase 4: Doctor Module (COMPLETADO ✅)**

- [x] Doctor Dashboard layout
- [x] Professional Profile page (`/doctor/profile`)
- [x] Profile header (avatar, name, contact info)
- [x] Professional stats (consultas atendidas)
- [x] Especialidad card
- [x] Work schedule display table
- [x] Exception Schedule Manager (`/doctor/excepciones-horario`)
- [x] My Appointments list
- [x] Virtual appointment room integration
- [x] Settings page

### **Phase 5: Admin Module - Core (COMPLETADO ✅)**

- [x] Admin Dashboard layout
- [x] Admin Patients management (`/admin/pacientes`)
- [x] Admin Doctors management (`/admin/medicos`)
- [x] Admin Appointments management (`/admin/citas`)
- [x] Admin Medications management (`/admin/medicamentos`)
- [x] Admin Specialties management (`/admin/especialidades`)
- [x] Admin Diseases management (`/admin/enfermedades`)
- [x] Admin Configuration (`/admin/configuracion`)

### **Phase 6: Admin Module - Reports (PENDIENTE 🚧)**

- [ ] Reports Dashboard (`/admin/reportes`)
- [ ] Statistics cards (total, attended, cancelled)
- [ ] Appointments by month chart
- [ ] Appointments by doctor chart
- [ ] Appointments by specialty chart
- [ ] CSV Export functionality
- [ ] Date range filter

### **Phase 7: Admin Module - Audit (PENDIENTE 🚧)**

- [ ] Audit Log page (`/admin/auditoria`)
- [ ] Activity log table
- [ ] Filters (user, action, date range)
- [ ] Show who did what and when
- [ ] Login/logout tracking
- [ ] Changes tracking (requires backend)

### **Phase 8: Admin Module - Users (PENDIENTE 🚧)**

- [ ] Users List page (`/admin/usuarios`)
- [ ] List all users (patients, doctors, admins)
- [ ] Activate/deactivate accounts
- [ ] Reset passwords
- [ ] View last access
- [ ] Role management

---

## 🔍 **Testing Strategy**

### **Unit Tests:**

- Services (auth, api, medico, paciente, admin)
- Component logic
- Form validation
- Pipe/utility functions
- Role-based guards

### **Integration Tests:**

- Auth flow (login → dashboard según rol)
- Form submissions
- API interactions
- Route guards

### **E2E Tests (with Playwright):**

- Complete user journeys (paciente, médico, admin)
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility testing
- Role-based access control

---

## 📚 **Documentation References**

### **Angular 2025:**

- Signals: <https://angular.dev/guide/signals>
- Standalone components: <https://angular.dev/guide/components/standalone-components>
- Zoneless: <https://angular.dev/guide/zoneless>
- Control flow: <https://angular.dev/guide/templates/control-flow>

### **Tailwind CSS 4:**

- Official docs: <https://tailwindcss.com/docs>
- Custom theming: <https://tailwindcss.com/docs/theme>
- Animation: <https://tailwindcss.com/docs/animation>

### **Backend API:**

- Swagger UI: <http://localhost:3000/api-json>
- JWT authentication flows
- Error response formats
- File upload specifications

---

## 🚨 **Important Notes**

1. **Security:** All protected routes require valid JWT token + correct role
2. **Role Detection:** El backend debe devolver el rol en el JWT o en la respuesta de login
3. **Redirection:** Post-login, redirigir a `/paciente/dashboard`, `/doctor/dashboard` o `/admin/dashboard` según rol
4. **Error Handling:** Backend returns structured error responses
5. **File Upload:** Max 10MB, specific formats allowed
6. **Token Management:** Store in localStorage, refresh strategy needed
7. **Responsive:** Mobile-first design required
8. **Accessibility:** WCAG 2.1 AA compliance
9. **Performance:** Lazy loading for heavy components (@defer)
10. **Doctor Profile:** El perfil profesional es lo que ven los pacientes al buscar médicos
11. **Admin Features:** Reports, Audit and Users modules require backend endpoints

---

## 📅 **Version History**

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-01-31 | Versión inicial con Auth, Patient y Doctor modules |
| 2.0.0 | 2026-02-04 | Completado Admin Module Core, Agregados Reports/Audit/Users |

**Last Updated:** 2026-02-04
**Version:** 2.0.0
**Maintainer:** Development Team
