import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './commands/commands.module';

async function bootstrap() {
  await CommandFactory.run(CommandsModule, {
    logger: ['error', 'warn', 'log'],
  });
}

bootstrap(); 