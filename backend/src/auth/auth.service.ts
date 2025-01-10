import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { ChannelService } from '../channel/channel.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private channelService: ChannelService,
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

    const welcomeChannel = await this.channelService.findOne('2d6bd759-b896-495a-a8b7-fd8a2bf7dba9');
    if (welcomeChannel) {
      await this.channelService.addUserToChannel(welcomeChannel, newUser);
    }

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
}

