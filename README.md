# 🏥 Hospital Frontend - Patient Portal

Angular 19 patient portal for hospital appointment management with AI-powered code review via GGA (Gentleman Guardian Angel).

**Tech Stack:** Angular 19 (standalone, signals, zoneless) + TailwindCSS v4 + TypeScript

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

**Backend required:** Ensure NestJS backend is running on `http://localhost:3000`

**Test credentials:**
- Email: `paciente@gmail.com`
- Password: `12345`

---

## 📋 Features

### ✅ Completed
- **Authentication:** Login, register, forgot password with JWT
- **Dashboard:** Overview with next appointment
- **Appointments:**
  - 3-step wizard to schedule appointments
  - List of upcoming/recent appointments
  - Detailed view with diagnosis, prescriptions, referrals
  - Edit appointment modal with availability validation
  - Cancel appointment (72h rule)

### ⏳ Pending
- Recetas (Prescriptions) module
- Derivaciones (Referrals) module
- Historia Clínica (Medical History)
- Profile editing
- Documents upload/download

---

## 🔧 Development

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.1.

## 🔧 Development

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.1.

### Available Scripts

```bash
npm start          # Start dev server (localhost:4200)
npm run build      # Production build
npm test           # Run tests with Vitest
```

---

## 🤖 Code Quality - GGA Integration

This project uses **Husky** + **GGA (Gentleman Guardian Angel)** for automated AI-powered code review on every commit.

### How it works

1. **Pre-commit hook:** Runs `gga run` before each commit
2. **AI Review:** Uses OpenCode AI to review staged TypeScript/JavaScript files
3. **Rules:** Follows guidelines from `AGENTS.md`
4. **Auto-block:** Prevents commits if code doesn't meet standards

### Configuration

**`.gga` file:**
```bash
PROVIDER="opencode"
FILE_PATTERNS="*.ts,*.tsx,*.js,*.jsx"
EXCLUDE_PATTERNS="*.test.ts,*.spec.ts,*.test.tsx,*.spec.tsx,*.d.ts"
RULES_FILE="AGENTS.md"
STRICT_MODE="true"
```

### Manual GGA Usage

```bash
gga run              # Review staged files (with cache)
gga run --no-cache   # Force full review
gga cache status     # Check cache info
gga config           # Show current config
```

### First-time setup

Husky hooks are installed automatically via `npm install` (runs `prepare` script).

If needed, reinstall manually:
```bash
npx husky install
```

---

---

## 📚 Project Structure

```
src/app/
├── core/
│   ├── guards/          # Route guards (auth)
│   ├── interceptors/    # HTTP interceptors (JWT)
│   ├── models/          # TypeScript DTOs
│   └── services/        # API services
├── features/
│   ├── auth/            # Authentication module
│   ├── dashboard/       # Main dashboard
│   ├── citas/           # Appointments CRUD
│   │   ├── agendar/     # 3-step wizard
│   │   ├── lista/       # List view
│   │   └── detalle/     # Details + edit modal
│   ├── profile/         # User profile
│   └── shared/layouts/  # Patient layout
└── shared/
    └── components/      # Reusable components (edit-cita-modal)
```

---

## 🎯 Architecture Patterns

- **Zoneless Angular 19** - No NgZone overhead
- **Signals** - Reactive state management
- **Standalone Components** - No NgModules
- **OnPush Change Detection** - Optimized performance
- **Component Input Binding** - Route params via `input()`
- **Function-based DI** - Using `inject()` instead of constructor injection
- **Control Flow Syntax** - `@if`, `@for`, `@switch` (no structural directives)

---

## 🔐 Environment Variables

Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

---

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# Test commit for Husky
