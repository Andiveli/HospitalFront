# 🏥 Hospital Frontend - Agent Specifications

## 📋 **Project Overview**

**Backend API:** `http://localhost:3000/api-json` (Swagger Documentation)
**UI Framework:** Tailwind CSS v4 (following best practices)
**Target Users:** Solo pacientes
**Authentication Flow:** Login → Dashboard → Perfil
**Priority Feature:** Gestión de pacientes completa

---

## 🎯 **User Journey Principal**

```
Página de Login (pública)
      ↓ (autenticación)
Dashboard Paciente (protegido)
      ↓
Gestión de Perfil Paciente (protegido)
      ↓
Historial Médico y Documentos (protegido)
```

---

## 🔐 **Authentication Strategy**

### **Endpoints Públicos:**

- `POST /auth` - Login
- `POST /auth` - Registro
- `GET /auth/confirmar/{token}` - Confirmar email
- `POST /auth/olvide-password` - Recuperar contraseña
- `GET /auth/recuperar-password/{token}` - Verificar token
- `POST /auth/recuperar-password/{token}` - Restablecer contraseña

### **Endpoints Protegidos (JWT Required):**

- `GET /auth/perfil` - Obtener perfil
- `POST /auth/cambiarPass` - Cambiar contraseña
- `POST /pacientes/addInfo` - Agregar información personal
- `GET /pacientes/myInfo` - Obtener información del paciente
- `POST /pacientes/addDocs` - Agregar documentos médicos
- Todos los endpoints de gestión de historia clínica

### **Security Implementation:**

- HTTP Client Interceptor para añadir `Bearer {token}` a requests protegidos
- Auth Guard para rutas protegidas
- Token storage en localStorage con signals
- Token refresh strategy

---

## 🗂️ **Feature Modules & Documentation Sources**

### **1. Authentication Module** 🔐

**Backend Docs:** `/auth/*` endpoints
**Components:**

- Login page (`/auth/login`)
- Register page (`/auth/register`)
- Forgot password (`/auth/forgot`)
- Reset password (`/auth/reset`)

**Key DTOs:**

```typescript
- LoginDto { email, password }
- SignupDto { cedula, nombres, email, password, genero }
- AuthResponseDto { message, data: { token } }
- PerfilResponseDto { id, cedula, nombreCompleto, email, verificado, genero, createdAt }
```

### **2. Patient Profile Module** 👤

**Backend Docs:** `/auth/perfil`, `/pacientes/*`
**Components:**

- Patient Dashboard (`/dashboard`)
- Profile Management (`/profile`)
- Personal Information Form
- Medical History Overview

**Key DTOs:**

```typescript
- InfoDto (estructura específica del backend)
- PerfilResponseDto
- MensajeResponseDto
```

### **3. Medical History Module** 📋

**Backend Docs:** `/paciente-enfermedad/*`, `/enfermedades/*`, `/tipo-enfermedad/*`
**Components:**

- Medical Conditions List
- Disease Details View
- Medical History Timeline

**Key DTOs:**

```typescript
-CreatePacienteEnfermedadDto - UpdatePacienteEnfermedadDto - EnfermedadDto;
```

### **4. Documents Module** 📄

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
│   │   ├── auth.service.ts
│   │   ├── api.service.ts
│   │   └── storage.service.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   └── guards/
│       └── auth.guard.ts
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/
│   │   └── dashboard/
│   ├── profile/
│   │   └── profile/
│   └── shared/
│       ├── components/
│       └── services/
├── app.ts
├── app.config.ts
└── app.routes.ts
```

### **State Management:**

- **Auth state:** Signals para user, token, isAuthenticated
- **Component state:** Signals para forms y UI state
- **No NgRx/Pinia:** Signals suffice for this scope

### **Error Handling:**

- Global error handler
- User-friendly error messages
- Network error recovery
- Form validation with Angular Reactive Forms

---

## 📝 **Development Checklist**

### **Phase 1: Foundation**

- [ ] Set up Tailwind CSS 4 configuration
- [ ] Create type definitions for all DTOs
- [ ] Implement auth service with token management
- [ ] Set up HTTP interceptor for JWT
- [ ] Create auth guard
- [ ] Configure routes (public vs protected)

### **Phase 2: Authentication**

- [ ] Login page component
- [ ] Register page component
- [ ] Forgot/Reset password flow
- [ ] Form validation and error handling
- [ ] Redirect after successful login

### **Phase 3: Patient Dashboard**

- [ ] Main dashboard layout
- [ ] User profile section
- [ ] Quick stats/overview
- [ ] Navigation sidebar
- [ ] Responsive design

### **Phase 4: Profile Management**

- [ ] Personal information form
- [ ] Medical history overview
- [ ] Password change functionality
- [ ] Form validation and save states

### **Phase 5: Documents & Medical History**

- [ ] Document upload component
- [ ] Document gallery
- [ ] Medical conditions list
- [ ] Document preview/download
- [ ] S3 integration for file storage

---

## 🔍 **Testing Strategy**

### **Unit Tests:**

- Services (auth, api)
- Component logic
- Form validation
- Pipe/utility functions

### **Integration Tests:**

- Auth flow (login → dashboard)
- Form submissions
- API interactions
- Route guards

### **E2E Tests (with Playwright):**

- Complete user journey
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility testing

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

1. **Security:** All protected routes require valid JWT token
2. **Error Handling:** Backend returns structured error responses
3. **File Upload:** Max 10MB, specific formats allowed
4. **Token Management:** Store in localStorage, refresh strategy needed
5. **Responsive:** Mobile-first design required
6. **Accessibility:** WCAG 2.1 AA compliance
7. **Performance:** Lazy loading for heavy components (@defer)

---

**Last Updated:** $(date)  
**Version:** 1.0.0  
**Maintainer:** Development Team

