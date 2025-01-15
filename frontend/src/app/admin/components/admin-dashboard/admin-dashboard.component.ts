import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, SystemInfo } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-overlay">
      <div class="admin-dashboard frosted-glass">
        <div class="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>
        
        <div class="dashboard-content">
          <ng-container *ngIf="!error; else errorTpl">
            <ng-container *ngIf="systemInfo; else loadingTpl">
              <div class="info-section">
                <h2>System Information</h2>
                <div class="info-grid">
                  <div class="info-item frosted-panel">
                    <label>Platform</label>
                    <span>{{ systemInfo.system.platform }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>CPUs</label>
                    <span>{{ systemInfo.system.cpus }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>Total Memory</label>
                    <span>{{ formatBytes(systemInfo.system.totalMemory) }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>Free Memory</label>
                    <span>{{ formatBytes(systemInfo.system.freeMemory) }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>System Uptime</label>
                    <span>{{ formatUptime(systemInfo.system.uptime) }}</span>
                  </div>
                </div>

                <h2>Application Information</h2>
                <div class="info-grid">
                  <div class="info-item frosted-panel">
                    <label>User Count</label>
                    <span>{{ systemInfo.application.userCount }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>Database Size</label>
                    <span>{{ systemInfo.application.databaseSize }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>Node Version</label>
                    <span>{{ systemInfo.application.nodeVersion }}</span>
                  </div>
                  <div class="info-item frosted-panel">
                    <label>Process Uptime</label>
                    <span>{{ formatUptime(systemInfo.application.processUptime) }}</span>
                  </div>
                </div>
              </div>
            </ng-container>
          </ng-container>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading system information...</p>
      </div>
    </ng-template>

    <ng-template #errorTpl>
      <div class="error-state">
        <p>{{ error }}</p>
        <button class="retry-button" (click)="loadSystemInfo()">Retry</button>
      </div>
    </ng-template>
  `,
  styles: [`
    .admin-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }

    .admin-dashboard {
      width: 100%;
      max-width: 1200px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 12px;
      position: relative;
    }

    .frosted-glass {
      background: rgba(var(--surface-dark-rgb), 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(var(--surface-light-rgb), 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .dashboard-header {
      padding: 2rem;
      border-bottom: 1px solid rgba(var(--surface-light-rgb), 0.1);
      
      h1 {
        margin: 0;
        color: var(--primary-light);
        font-size: 2rem;
        font-weight: 600;
      }
    }

    .dashboard-content {
      padding: 2rem;
    }

    h2 {
      margin: 2rem 0 1rem;
      color: var(--primary-light);
      font-size: 1.5rem;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-item {
      padding: 1.5rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 500;
      }

      span {
        color: var(--primary-light);
        font-size: 1.1rem;
      }
    }

    .frosted-panel {
      background: rgba(var(--surface-medium-rgb), 0.4);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(var(--surface-light-rgb), 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        background: rgba(var(--surface-medium-rgb), 0.5);
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      color: var(--text-muted);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(var(--accent-2-rgb), 0.3);
      border-top-color: var(--accent-2);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .error-state {
      text-align: center;
      padding: 4rem;
      color: var(--error);

      p {
        margin-bottom: 1rem;
      }
    }

    .retry-button {
      padding: 0.5rem 1rem;
      background: var(--accent-2);
      border: none;
      border-radius: 4px;
      color: var(--primary-light);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--accent-1);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(var(--surface-dark-rgb), 0.5);
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(var(--surface-light-rgb), 0.3);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgba(var(--surface-light-rgb), 0.4);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  systemInfo: SystemInfo | null = null;
  error: string | null = null;

  constructor(private adminService: AdminService) {
    console.log('AdminDashboardComponent constructed');
  }

  ngOnInit() {
    console.log('AdminDashboardComponent initialized');
    this.loadSystemInfo();
  }

  loadSystemInfo() {
    console.log('Loading system info...');
    this.error = null;
    this.systemInfo = null;
    
    this.adminService.getSystemInfo().subscribe({
      next: (info: SystemInfo) => {
        console.log('System info loaded:', info);
        this.systemInfo = info;
      },
      error: (err) => {
        console.error('Error loading system info:', err);
        this.error = 'Failed to load system information. Please try again.';
      }
    });
  }

  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '< 1m';
  }
} 