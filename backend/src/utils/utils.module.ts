import { Module } from '@nestjs/common';
import { NameGenerator } from './name-generator';

@Module({
  providers: [NameGenerator],
  exports: [NameGenerator],
})
export class UtilsModule {} 