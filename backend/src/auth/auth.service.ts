import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }

  async signUp(email: string, password: string, username: string, ticketId: string): Promise<any> {
    const { data: authData, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user) throw new Error('Failed to create user');

    const newUser = await this.userService.create({
      id: authData.user.id,
      email,
      username,
      ticketId: ticketId,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`,
    });

    return {
      user: newUser,
      session: authData.session,
    };
  }

  async signIn(email: string, password: string): Promise<any> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = await this.userService.findByEmail(email);
    
    return {
      user,
      session: data.session
    };
  }

  async validateToken(token: string): Promise<any> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw new UnauthorizedException(error.message);
    return data;
  }
}

