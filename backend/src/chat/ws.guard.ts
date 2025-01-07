import { CanActivate, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(
    context: any,
  ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
    const client = context.switchToWs().getClient();
    const token = client.handshake?.auth?.token;
    
    if (!token) {
      return true; // Allow anonymous connections
    }

    return this.authService.validateToken(token)
      .then(user => {
        client.user = user;
        return true;
      })
      .catch(() => true); // Still allow connection even if token is invalid
  }
} 