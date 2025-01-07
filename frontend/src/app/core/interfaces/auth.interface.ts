import { User } from './user.interface';

export interface SignUpDto {
  email: string;
  password: string;
  ticketId: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session?: any;
} 