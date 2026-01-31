import type { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'hospital_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  if (!token) {
    return next(req);
  }

  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(clonedRequest);
};
