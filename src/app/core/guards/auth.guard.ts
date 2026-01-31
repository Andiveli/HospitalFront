import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir a login si no está autenticado
  return router.createUrlTree(['/auth/login']);
};

/**
 * Guard para rutas exclusivas de médicos
 * Solo permite acceso si el usuario tiene rol de médico o ambos roles
 */
export const doctorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isDoctor() || authService.hasBothRoles()) {
    return true;
  }

  // Si no es médico ni tiene ambos roles, redirigir al dashboard del paciente
  return router.createUrlTree(['/dashboard']);
};

/**
 * Guard para rutas exclusivas de pacientes
 * Solo permite acceso si el usuario tiene rol de paciente o ambos roles
 */
export const patientGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isPatient() || authService.hasBothRoles()) {
    return true;
  }

  // Si no es paciente ni tiene ambos roles, redirigir al dashboard del médico
  return router.createUrlTree(['/doctor/dashboard']);
};
