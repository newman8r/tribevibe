import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

// This guard is for routes that should only redirect to auth if there was a previous session
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      // Only redirect if there was a previous session (expired token)
      if (authService.hadPreviousSession() && !user) {
        router.navigate(['/auth']);
        return false;
      }
      return true;
    })
  );
};

// This guard is for routes that strictly require authentication
export const restrictedGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) return true;
      
      // For restricted routes, we'll show a message that login is required
      router.navigate(['/auth'], { 
        queryParams: { 
          message: 'This feature requires authentication' 
        } 
      });
      return false;
    })
  );
}; 