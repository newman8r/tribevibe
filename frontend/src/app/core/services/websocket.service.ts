import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Message } from '../interfaces/message.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private readonly WS_URL = environment.apiBaseUrl; // Socket.IO will automatically convert http:// to ws://

  constructor(private authService: AuthService) {
    this.socket = io(this.WS_URL, {
      auth: {
        token: this.authService.getSessionToken()
      },
      transports: ['websocket', 'polling']
    });

    // Update token when it changes
    this.authService.sessionToken$.subscribe(token => {
      if (this.socket) {
        this.socket.auth = { token };
      }
    });
  }

  joinChannel(userId: string, channelId: string): void {
    this.socket.emit('joinChannel', { userId, channelId });
  }

  onJoinedChannel(): Observable<{ channelId: string; userId: string }> {
    return new Observable(observer => {
      this.socket.on('joinedChannel', (data: { channelId: string; userId: string }) => observer.next(data));
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

  onChannelHistory(): Observable<{ messages: Message[]; userStatuses: { [key: string]: string } }> {
    return new Observable(observer => {
      this.socket.on('channelHistory', (data: { messages: Message[]; userStatuses: { [key: string]: string } }) => {
        observer.next(data);
      });
    });
  }

  onUserStatusUpdate(): Observable<{ userId: string; status: string }> {
    return new Observable(observer => {
      this.socket.on('userStatusUpdate', (status: { userId: string; status: string }) => observer.next(status));
    });
  }

  updatePresence(userId: string): void {
    this.socket.emit('updatePresence', { userId });
  }

  updateManualStatus(userId: string, status: string): void {
    this.socket.emit('updateManualStatus', { userId, status });
  }

  addReaction(messageId: string, emoji: string, userId: string): void {
    this.socket.emit('addReaction', { messageId, emoji, userId });
  }

  removeReaction(messageId: string, emoji: string, userId: string): void {
    this.socket.emit('removeReaction', { messageId, emoji, userId });
  }

  onMessageReactionUpdate(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('messageReactionUpdate', message => observer.next(message));
    });
  }

  // Thread-related methods
  joinThread(messageId: string) {
    this.socket.emit('joinThread', { messageId });
  }

  leaveThread(messageId: string) {
    this.socket.emit('leaveThread', { messageId });
  }

  sendThreadReply(parentMessageId: string, userId: string, content: string) {
    this.socket.emit('sendThreadReply', { parentMessageId, userId, content });
  }

  onThreadHistory(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('threadHistory', (message: Message) => {
        observer.next(message);
      });
    });
  }

  onThreadUpdate(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('threadUpdate', (message: Message) => {
        observer.next(message);
      });
    });
  }
} 