import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'hospital_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Leer el token directamente de localStorage (sin inyectar AuthService para evitar circular dependency)
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  // Si no hay token, enviar la request sin modificar
  if (!token) {
    console.log('🔓 AuthInterceptor: No token available for', req.url);
    return next(req);
  }

  // Clonar la request y agregar el header de autorización
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('🔐 AuthInterceptor: Adding Bearer token to', req.url);

  return next(clonedRequest);
};
