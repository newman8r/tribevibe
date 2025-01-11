import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="asset-test">
      <!-- Test Image -->
      <img src="assets/images/test.png" alt="Test Asset">
      
      <!-- Test Favicon -->
      <img src="assets/favicon/favicon.svg" alt="Favicon">
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .asset-test {
      padding: 20px;
      background: #f0f0f0;
    }
    img {
      max-width: 100px;
      margin: 10px;
    }
  `]
})
export class AppComponent {
  title = 'frontend';
} 