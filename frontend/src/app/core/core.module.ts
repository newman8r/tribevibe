import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { WebsocketService } from './services/websocket.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    provideHttpClient(),
    ApiService,
    AuthService,
    WebsocketService
  ]
})
export class CoreModule { } 