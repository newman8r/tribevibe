import { Module } from '@nestjs/common';
import { ClearVectorDBCommand } from './commands/clear-vectordb.command';
// ... other imports

@Module({
  imports: [/* ... your existing imports ... */],
  providers: [
    ClearVectorDBCommand,
    // ... your other commands ...
  ],
})
export class CliModule {} 