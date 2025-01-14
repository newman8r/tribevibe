import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { Message } from '../interfaces/message.interface';
import { AuthService } from './auth.service';
import { User } from '../interfaces/user.interface';
import { DirectMessageConversation } from '../interfaces/direct-message-conversation.interface';
import { Channel } from '../interfaces/channel.interface';
import { UserStatus } from '../interfaces/user-status.enum';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private readonly WS_URL = environment.apiBaseUrl; // Socket.IO will automatically convert http:// to ws://
  private userStatusSubject = new BehaviorSubject<UserStatus>(UserStatus.OFFLINE);
  private anonymousUsernameSubject = new BehaviorSubject<string | null>(null);

  userStatus$ = this.userStatusSubject.asObservable();
  anonymousUsername$ = this.anonymousUsernameSubject.asObservable();

  constructor(private authService: AuthService) {
    this.socket = io(this.WS_URL, {
      auth: {
        token: this.authService.getSessionToken()
      },
      transports: ['websocket', 'polling']
    });

    // Subscribe to token changes
    this.authService.accessToken$.subscribe((token: string | null) => {
      if (this.socket) {
        this.socket.auth = { token };
        // Reconnect with new token if socket is already connected
        if (this.socket.connected) {
          this.socket.disconnect().connect();
        }
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      // Join user's personal room for notifications
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.socket.emit('joinUserRoom', { userId: currentUser.id });
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Listen for status updates and update the BehaviorSubject
    this.socket.on('userStatusUpdate', ({ userId, status }) => {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.id === userId || (!currentUser && userId === localStorage.getItem('anonymousId'))) {
        this.userStatusSubject.next(status as UserStatus);
      }
    });

    // Listen for anonymous username updates
    this.socket.on('anonymousUsernameUpdate', (username: string) => {
      this.anonymousUsernameSubject.next(username);
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

  sendMessage(userId: string, channelId: string, content: string, fileId?: string): void {
    this.socket.emit('sendMessage', { userId, channelId, content, fileId });
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

  getUserList(): void {
    console.log('Requesting user list');
    this.socket.emit('getUserList');
  }

  onUserList(): Observable<(User & { status: string })[]> {
    return new Observable(observer => {
      this.socket.on('userList', (users: (User & { status: string })[]) => {
        console.log('Received user list:', users);
        observer.next(users);
      });
    });
  }

  // Direct Message Methods
  startDirectMessage(userId: string, otherUserId: string): void {
    this.socket.emit('startDirectMessage', { userId, otherUserId });
  }

  onDirectMessageHistory(): Observable<{
    conversation: DirectMessageConversation;
    messages: Message[];
    userStatuses: { [key: string]: string };
  }> {
    return new Observable(observer => {
      this.socket.on('directMessageHistory', data => observer.next(data));
    });
  }

  sendDirectMessage(userId: string, conversationId: string, content: string): void {
    this.socket.emit('sendDirectMessage', { userId, conversationId, content });
  }

  onNewDirectMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('newDirectMessage', message => {
        console.log('New direct message received:', message);
        observer.next(message);
      });
    });
  }

  leaveDirectMessage(conversationId: string): void {
    this.socket.emit('leaveDirectMessage', { conversationId });
  }

  getUserConversations(userId: string): void {
    this.socket.emit('getUserConversations', { userId });
  }

  onUserConversations(): Observable<{
    conversations: DirectMessageConversation[];
  }> {
    return new Observable(observer => {
      this.socket.on('userConversations', data => {
        console.log('Received conversations:', data);
        observer.next(data);
      });
    });
  }

  onUnreadCountsUpdate(): Observable<{ [conversationId: string]: number }> {
    return new Observable(observer => {
      this.socket.on('unreadCountsUpdate', (data: { [conversationId: string]: number }) => {
        console.log('Received unread counts update in service:', data);
        observer.next(data);
      });
    });
  }

  resetUnreadCount(userId: string, conversationId: string): void {
    this.socket.emit('resetUnreadCount', { userId, conversationId });
  }

  getUnreadCounts(userId: string): void {
    console.log('Requesting unread counts for user:', userId);
    this.socket.emit('getUnreadCounts', { userId });
  }

  onChannelCreated(): Observable<Channel> {
    return new Observable(observer => {
      this.socket.on('channelCreated', (channel: Channel) => observer.next(channel));
    });
  }
} 