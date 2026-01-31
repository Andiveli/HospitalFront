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
 * Solo permite acceso si el usuario tiene rol de médico
 */
export const doctorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isDoctor()) {
    return true;
  }

  // Si no es médico, redirigir al dashboard del paciente
  return router.createUrlTree(['/dashboard']);
};

/**
 * Guard para rutas exclusivas de pacientes
 * Solo permite acceso si el usuario tiene rol de paciente
 */
export const patientGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isPatient()) {
    return true;
  }

  // Si no es paciente, redirigir al dashboard del médico
  return router.createUrlTree(['/doctor/dashboard']);
};
