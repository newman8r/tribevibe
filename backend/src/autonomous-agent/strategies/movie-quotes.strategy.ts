import { Injectable } from '@nestjs/common';
import { BaseStrategy } from './base-strategy.interface';
import { Message } from '../../entities/message.entity';

@Injectable()
export class MovieQuotesStrategy implements BaseStrategy {
  private quotes = [
    "I'll be back!",
    "May the force be with you!",
    "To infinity and beyond!",
    "Here's looking at you, kid.",
    "You're gonna need a bigger boat.",
    "Say hello to my little friend!",
    "Life is like a box of chocolates.",
    "I see dead people.",
    "You shall not pass!",
    "There's no place like home."
  ];

  async processMessage(message: Message): Promise<string | null> {
    console.log('MovieQuotesStrategy processing message:', message.content);
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[randomIndex];
  }
}

export default MovieQuotesStrategy; 