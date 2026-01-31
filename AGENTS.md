# 🏥 Hospital Frontend - Agent Specifications

## 📋 **Project Overview**

**Backend API:** `http://localhost:3000/api-json` (Swagger Documentation)
**UI Framework:** Tailwind CSS v4 (following best practices)
**Target Users:** Pacientes y Médicos
**Authentication Flow:** 
- Pacientes: Login → Dashboard Paciente → Perfil/Historial/Citas
- Médicos: Login → Dashboard Médico → Perfil Profesional → Mis Consultas
**Core Features:** 
- Gestión de pacientes completa (completado ✅)
- Gestión de médicos y sus perfiles profesionales (en progreso)
- Sistema de reserva y atención de citas virtuales

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

### **Médico Journey (EN DESARROLLO)**
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

### **Security Implementation:**

- HTTP Client Interceptor para añadir `Bearer {token}` a requests protegidos
- Role-based Auth Guards (`pacienteGuard`, `medicoGuard`)
- Token storage en localStorage con signals
- Token refresh strategy
- Redirección basada en rol post-login

---

## 🗂️ **Feature Modules & Documentation Sources**

### **1. Authentication Module** 🔐

**Backend Docs:** `/auth/*` endpoints
**Components:**

- Login page (`/auth/login`) - Detecta rol y redirige
- Register page (`/auth/register`)
- Forgot password (`/auth/forgot`)
- Reset password (`/auth/reset`)

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

### **3. Doctor Module** 👨‍⚕️ (EN DESARROLLO)

**Backend Docs:** `/medicos/*`, `/auth/perfil`
**Components:**

- Doctor Dashboard (`/medico/dashboard`)
- **Professional Profile (`/medico/perfil-profesional`)** ⭐ CURRENT FOCUS
- Work Schedule Manager (`/medico/horarios`)
- My Appointments (`/medico/mis-consultas`)
- Virtual Appointment Room (`/medico/consulta/:id`)

**Key DTOs:**

```typescript
// Perfil Profesional del Médico
- MedicoPerfilDto {
    id: number;
    cedula: string;
    nombres: string;
    apellidos: string;
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

- CreateHorarioDto {
    diaSemana: string;
    horaInicioManana?: string;
    horaFinManana?: string;
    horaInicioTarde?: string;
    horaFinTarde?: string;
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
    apellidos: string;
    edad: number;
    genero: string;
  }
```

### **4. Medical History Module** 📋

**Backend Docs:** `/paciente-enfermedad/*`, `/enfermedades/*`, `/tipo-enfermedad/*`
**Components:**

- Medical Conditions List
- Disease Details View
- Medical History Timeline

**Key DTOs:**

```typescript
- CreatePacienteEnfermedadDto
- UpdatePacienteEnfermedadDto
- EnfermedadDto
```

### **5. Documents Module** 📄

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

### **6. Appointments Module** 📅

**Backend Docs:** `/citas/*`
**Components:**

- Appointment Calendar (paciente)
- Available Slots View (paciente)
- My Appointments List (ambos roles)
- Virtual Room (médico y paciente)

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
│   │   └── storage.ts              # LocalStorage service
│   ├── interceptors/
│   │   └── auth.ts                 # JWT interceptor
│   └── guards/
│       ├── auth.ts                 # General auth guard
│       ├── paciente.ts             # Paciente role guard
│       └── medico.ts               # Medico role guard
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── paciente/                   # ✅ COMPLETADO
│   │   ├── dashboard/
│   │   ├── perfil/
│   │   ├── historial-medico/
│   │   └── documentos/
│   ├── medico/                     # 🚧 EN DESARROLLO
│   │   ├── dashboard/
│   │   ├── perfil-profesional/     # ⭐ CURRENT FOCUS
│   │   ├── horarios/
│   │   └── mis-consultas/
│   └── shared/
│       ├── components/
│       │   ├── sidebar/
│       │   ├── navbar/
│       │   └── button/
│       └── services/
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

### **Phase 4: Doctor Module - Professional Profile (EN PROGRESO 🚧)**

- [ ] **Doctor Professional Profile page (`/medico/perfil-profesional`)**
  - [ ] Profile header (avatar, name, contact info)
  - [ ] Professional stats (consultas atendidas, calificación)
  - [ ] Especialidad card
  - [ ] Work schedule display table
  - [ ] "Solicitar Excepción" button
  - [ ] Edit profile functionality
- [ ] Doctor Dashboard layout
- [ ] Professional info form (especialidad, registro profesional)
- [ ] Biography section

### **Phase 5: Doctor Module - Schedule Management (PENDIENTE)**

- [ ] Work schedule configuration page
- [ ] Day/hour selection interface
- [ ] Exception requests system
- [ ] Schedule validation (no overlapping)

### **Phase 6: Doctor Module - Appointments (PENDIENTE)**

- [ ] "Mis Consultas" list page
- [ ] Appointment detail view
- [ ] Virtual appointment room
- [ ] Medical notes input
- [ ] Patient history access during consultation

### **Phase 7: Appointment System Integration (PENDIENTE)**

- [ ] Patient appointment booking flow
- [ ] Doctor appointment confirmation
- [ ] Video call integration
- [ ] Appointment notifications

---

## 🔍 **Testing Strategy**

### **Unit Tests:**

- Services (auth, api, medico, paciente)
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

- Complete user journeys (paciente y médico)
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
3. **Redirection:** Post-login, redirigir a `/paciente/dashboard` o `/medico/dashboard` según rol
4. **Error Handling:** Backend returns structured error responses
5. **File Upload:** Max 10MB, specific formats allowed
6. **Token Management:** Store in localStorage, refresh strategy needed
7. **Responsive:** Mobile-first design required
8. **Accessibility:** WCAG 2.1 AA compliance
9. **Performance:** Lazy loading for heavy components (@defer)
10. **Doctor Profile:** El perfil profesional es lo que ven los pacientes al buscar médicos

---

**Last Updated:** 2026-01-31
**Version:** 2.0.0
**Maintainer:** Development Team
