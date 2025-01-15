import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
@Command({ name: 'set-admin', description: 'Set a user as admin by email' })
export class SetAdminCommand extends CommandRunner {
  constructor(private userService: UserService) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const [email] = passedParams;
    if (!email) {
      console.error('Email is required');
      return;
    }

    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        console.error('User not found');
        return;
      }

      await this.userService.update(user.id, { isAdmin: true });
      console.log(`Successfully set user ${email} as admin`);
    } catch (error) {
      console.error('Failed to set admin:', error.message);
    }
  }
} 