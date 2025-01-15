import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth.guard';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class AdminGuard extends AuthGuard {
  constructor(
    authService: AuthService,
    userService: UserService
  ) {
    super(authService, userService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check if user is authenticated using parent AuthGuard
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    return true;
  }
} 