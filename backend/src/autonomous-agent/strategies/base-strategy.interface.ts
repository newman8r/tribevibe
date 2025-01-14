import { Message } from '../../entities/message.entity';

export interface BaseStrategy {
  processMessage(message: Message): Promise<string | null>;
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
} 