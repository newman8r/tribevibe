import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat.component';
import { restrictedGuard } from '../core/guards/auth.guard';
import { FileUploadPanelComponent } from './components/file-upload-panel/file-upload-panel.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

const routes: Routes = [
  { 
    path: '', 
    component: ChatComponent,
    children: [
      {
        path: 'upload',
        component: FileUploadPanelComponent,
        canActivate: [restrictedGuard]
      },
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [restrictedGuard]
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ChatComponent
  ]
})
export class ChatModule { } 