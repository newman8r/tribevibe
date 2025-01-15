import { Controller, Post, Body, Options, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(200)
  async signUp(@Body() body: { email: string; password: string; username: string; ticketId?: string }) {
    return this.authService.signUp(body.email, body.password, body.username, body.ticketId || '');
  }

  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() body: { email: string; password: string }) {
    return this.authService.signIn(body.email, body.password);
  }

  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Options('signin')
  signin() {
    return;
  }
}

