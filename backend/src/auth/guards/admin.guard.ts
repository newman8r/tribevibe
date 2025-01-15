import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id; // Assuming you have a user object from previous auth

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.userService.findOne(userId);
    
    if (!user?.isAdmin) {
      throw new UnauthorizedException('User is not an admin');
    }

    return true;
  }
} 