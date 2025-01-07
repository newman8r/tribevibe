import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-hub',
  template: `
    <div class="social-hub">
      <!-- Placeholder for social hub -->
      <p>Social Hub Component</p>
    </div>
  `,
  styles: [`
    .social-hub {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-light);
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class SocialHubComponent {} 