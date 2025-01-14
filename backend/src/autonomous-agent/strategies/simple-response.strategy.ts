import { Injectable } from '@nestjs/common';
import { BaseStrategy } from './base-strategy.interface';
import { Message } from '../../entities/message.entity';

@Injectable()
export class SimpleResponseStrategy implements BaseStrategy {
  private responses = [
    "I'll be back!",
    "Life is like a box of chocolates.",
    "May the force be with you!",
    "To infinity and beyond!",
    "Houston, we have a problem.",
    "Just keep swimming!",
    "There's no place like home.",
    "E.T. phone home.",
    "Why so serious?",
    "Hasta la vista, baby!"
  ];

  async processMessage(message: Message): Promise<string | null> {
    console.log('SimpleResponseStrategy processing message:', message.content);
    const randomIndex = Math.floor(Math.random() * this.responses.length);
    return this.responses[randomIndex];
  }
}

export default SimpleResponseStrategy; 