import { Routes } from '@angular/router';
import { authGuard, restrictedGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'chat',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'chat',
    loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [() => adminGuard()],
    canMatch: [() => adminGuard()]
  },
  { 
    path: '**', 
    redirectTo: 'chat' 
  }
];
