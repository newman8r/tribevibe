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
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_KEY')
    );
  }

  async signUp(email: string, password: string, ticketId: string): Promise<any> {
    const { data: authData, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user) throw new Error('Failed to create user');

    const newUser = await this.userService.create({
      username: email.split('@')[0],
      ticketId: ticketId,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`,
    });

    const welcomeChannel = await this.channelService.findOne('cae31388-5a90-4506-98fb-288f34ca0f40');
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

    return data.user;
  }

  async validateToken(token: string): Promise<any> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  }
}

