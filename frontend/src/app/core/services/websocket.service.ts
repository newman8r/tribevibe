import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Message } from '../interfaces/message.interface';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private readonly SOCKET_URL = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.SOCKET_URL);
  }

  joinChannel(userId: string, channelId: string): void {
    this.socket.emit('joinChannel', { userId, channelId });
  }

  onJoinedChannel(): Observable<{ channelId: string }> {
    return new Observable(observer => {
      this.socket.on('joinedChannel', data => observer.next(data));
    });
  }

  sendMessage(userId: string, channelId: string, content: string): void {
    this.socket.emit('sendMessage', { userId, channelId, content });
  }

  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('newMessage', message => observer.next(message));
    });
  }

  onChannelHistory(): Observable<Message[]> {
    return new Observable(observer => {
      this.socket.on('channelHistory', messages => observer.next(messages));
    });
  }
} 