import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-promo-space',
  template: `
    <div class="promo-space">
      <div class="promo-card">
        <h3>Premium Features</h3>
        <ul>
          <li>✨ Custom Emojis</li>
          <li>🎨 Themes</li>
          <li>🔊 Voice Channels</li>
          <li>📱 Mobile App</li>
        </ul>
        <button class="upgrade-btn">Upgrade Now</button>
      </div>
    </div>
  `,
  styleUrls: [],
  standalone: true,
  imports: [CommonModule]
})
export class PromoSpaceComponent {} 