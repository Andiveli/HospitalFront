import type { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl; // http://localhost:3000

  // Solo modificar URLs que no sean absolutas y no incluyan /auth/
  // Los servicios deben usar URLs como: /api/estilos-vida
  if (!req.url.startsWith('http') && !req.url.startsWith('/auth/')) {
    const apiReq = req.clone({
      url: `${apiUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`,
    });
    return next(apiReq);
  }

  return next(req);
};
