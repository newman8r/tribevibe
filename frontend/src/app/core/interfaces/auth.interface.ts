import { User } from './user.interface';

export interface AuthSession {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface AuthResponse {
  user: User;
  session: AuthSession;
}

export interface SignUpDto {
  email: string;
  username: string;
  password: string;
  ticketId?: string;
}

export interface SignInDto {
  email: string;
  password: string;
} 