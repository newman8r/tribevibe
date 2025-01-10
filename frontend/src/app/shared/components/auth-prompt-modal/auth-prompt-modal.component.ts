import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-prompt-modal',
  templateUrl: './auth-prompt-modal.component.html',
  styleUrls: ['./auth-prompt-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AuthPromptModalComponent {
  @Input() feature: string = 'This feature';
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
    this.close.emit();
  }

  onClose() {
    this.close.emit();
  }
} 