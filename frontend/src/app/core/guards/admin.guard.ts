import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user?.isAdmin) {
        return true;
      }
      
      router.navigate(['/chat'], { 
        queryParams: { 
          message: 'Admin access required' 
        } 
      });
      return false;
    })
  );
}; 