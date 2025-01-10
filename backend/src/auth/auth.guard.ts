import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    try {
      const supabaseUser = await this.authService.validateToken(token);
      console.log('Validated Supabase user:', supabaseUser);
      
      const user = await this.userService.findByEmail(supabaseUser.email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      console.log('Complete user entity:', user);
      request.user = user;
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 