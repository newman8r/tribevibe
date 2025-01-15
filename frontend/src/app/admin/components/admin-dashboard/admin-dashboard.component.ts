import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemInfo } from '../../services/admin.service';

interface AdminTab {
  id: string;
  label: string;
  icon: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
}

interface VectorKnowledgeBase {
  id: string;
  title: string;
  description: string;
  files: VectorFile[];
  settings: {
    chunkSize: number;
    chunkOverlap: number;
    embeddingModel: string;
    similarityThreshold: number;
  };
  lastUpdated: Date;
  isExpanded?: boolean;
}

interface VectorFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: 'processed' | 'processing' | 'failed';
}

interface AIAgent {
  id: string;
  name: string;
  strategy: string;
  channels: string[];
  personality: string;
  knowledgeBases: string[];
  avatarUrl: string;
  isExpanded?: boolean;
  newChannel?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-dashboard">
      <div class="return-bar">
        <a routerLink="/chat" class="return-button">
          <span class="return-arrow">←</span>
          Return to App
        </a>
      </div>

      <div class="tab-container">
        <div class="tabs">
          <button 
            *ngFor="let tab of tabs" 
            class="tab-button" 
            [class.active]="activeTab === tab.id"
            (click)="setActiveTab(tab.id)">
            <i class="tab-icon" [innerHTML]="tab.icon"></i>
            {{ tab.label }}
            <div class="tab-glow"></div>
          </button>
        </div>
      </div>

      <div class="tab-content" [ngSwitch]="activeTab">
        <div *ngSwitchCase="'info'" class="system-info">
          <div *ngIf="systemInfo" class="info-grid">
            <div class="info-card system">
              <h3>♪ System Info</h3>
              <div class="info-item">
                <span>Platform:</span>
                <span>{{ systemInfo.system.platform }}</span>
              </div>
              <div class="info-item">
                <span>CPUs:</span>
                <span>{{ systemInfo.system.cpus }}</span>
              </div>
              <div class="info-item">
                <span>Total Memory:</span>
                <span>{{ formatBytes(systemInfo.system.totalMemory) }}</span>
              </div>
              <div class="info-item">
                <span>Free Memory:</span>
                <span>{{ formatBytes(systemInfo.system.freeMemory) }}</span>
              </div>
              <div class="info-item">
                <span>Uptime:</span>
                <span>{{ formatUptime(systemInfo.system.uptime) }}</span>
              </div>
            </div>

            <div class="info-card application">
              <h3>♫ Application Info</h3>
              <div class="info-item">
                <span>Users:</span>
                <span>{{ systemInfo.application.userCount }}</span>
              </div>
              <div class="info-item">
                <span>Database Size:</span>
                <span>{{ systemInfo.application.databaseSize }}</span>
              </div>
              <div class="info-item">
                <span>Node Version:</span>
                <span>{{ systemInfo.application.nodeVersion }}</span>
              </div>
              <div class="info-item">
                <span>Process Uptime:</span>
                <span>{{ formatUptime(systemInfo.application.processUptime) }}</span>
              </div>
            </div>
          </div>
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </div>
        
        <div *ngSwitchCase="'users'" class="users-tab">
          <h2>♬ User Management</h2>
          <p>User management features coming soon...</p>
        </div>

        <div *ngSwitchCase="'logs'" class="logs-tab">
          <h2>♩ System Logs</h2>
          <p>System logs features coming soon...</p>
        </div>

        <div *ngSwitchCase="'agents'" class="agents-tab">
          <div class="header-actions">
            <h2>🤖 AI Agents</h2>
            <button class="add-agent-btn">+ New Agent</button>
          </div>
          
          <div class="agents-table">
            <div class="table-header">
              <div class="col-agent">Agent</div>
              <div class="col-strategy">Strategy</div>
              <div class="col-channels">Channels</div>
              <div class="col-actions">Actions</div>
            </div>
            
            <div *ngFor="let agent of aiAgents" class="agent-row">
              <div class="agent-main-row" [class.expanded]="agent.isExpanded">
                <div class="col-agent">
                  <img [src]="agent.avatarUrl" [alt]="agent.name" class="agent-avatar">
                  {{ agent.name }}
                </div>
                <div class="col-strategy">{{ agent.strategy }}</div>
                <div class="col-channels">
                  <span *ngFor="let channel of agent.channels" class="channel-tag">
                    {{ channel }}
                  </span>
                </div>
                <div class="col-actions">
                  <button class="manage-btn" (click)="toggleAgentExpand(agent)">
                    {{ agent.isExpanded ? 'Close' : 'Manage' }}
                  </button>
                </div>
              </div>
              
              <div class="agent-expanded-panel" *ngIf="agent.isExpanded">
                <div class="panel-content">
                  <div class="panel-section">
                    <h4>Strategy</h4>
                    <div class="strategy-selector">
                      <select [(ngModel)]="agent.strategy" class="setting-input">
                        <option *ngFor="let strategy of strategies" [value]="strategy.name">
                          {{ strategy.name }}
                        </option>
                      </select>
                      <div class="strategy-description" *ngIf="getStrategyDescription(agent.strategy)">
                        {{ getStrategyDescription(agent.strategy) }}
                      </div>
                    </div>
                  </div>

                  <div class="panel-section">
                    <h4>Channels</h4>
                    <div class="channels-manager">
                      <div class="current-channels">
                        <span *ngFor="let channel of agent.channels" class="channel-tag">
                          {{ channel }}
                        </span>
                      </div>
                      <div class="add-channel">
                        <select [(ngModel)]="agent.newChannel" class="setting-input">
                          <option value="">Select a channel...</option>
                          <option *ngFor="let channel of getAvailableChannels(agent)" [value]="channel">
                            {{ channel }}
                          </option>
                        </select>
                        <button 
                          class="add-channel-btn" 
                          [disabled]="!agent.newChannel"
                          (click)="addChannel(agent)">
                          Add Channel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="panel-section">
                    <h4>Personality</h4>
                    <textarea class="personality-input" [(ngModel)]="agent.personality"></textarea>
                  </div>
                  
                  <div class="panel-section">
                    <h4>Knowledge Bases</h4>
                    <div class="knowledge-bases-list">
                      <div *ngFor="let kb of agent.knowledgeBases" class="knowledge-base-item">
                        <span class="kb-name">{{ kb }}</span>
                        <button class="remove-kb-btn">×</button>
                      </div>
                      <button class="add-kb-btn">+ Add Knowledge Base</button>
                    </div>
                  </div>
                  
                  <div class="panel-section">
                    <h4>Avatar</h4>
                    <div class="avatar-preview">
                      <img [src]="agent.avatarUrl" [alt]="agent.name">
                      <button class="change-avatar-btn">Change Avatar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngSwitchCase="'vectors'" class="vectors-tab">
          <div class="header-actions">
            <h2>🧬 Vector Knowledge Bases</h2>
            <button class="add-kb-btn">+ New Knowledge Base</button>
          </div>
          
          <div class="vectors-table">
            <div class="table-header">
              <div class="col-title">Title</div>
              <div class="col-files">Files</div>
              <div class="col-updated">Last Updated</div>
              <div class="col-actions">Actions</div>
            </div>
            
            <div *ngFor="let kb of vectorKBs" class="vector-row">
              <div class="vector-main-row" [class.expanded]="kb.isExpanded">
                <div class="col-title">
                  <span class="kb-title">{{ kb.title }}</span>
                  <span class="kb-description">{{ kb.description }}</span>
                </div>
                <div class="col-files">{{ kb.files.length }} files</div>
                <div class="col-updated">{{ kb.lastUpdated | date:'short' }}</div>
                <div class="col-actions">
                  <button class="manage-btn" (click)="toggleVectorKBExpand(kb)">
                    {{ kb.isExpanded ? 'Close' : 'Manage' }}
                  </button>
                </div>
              </div>
              
              <div class="vector-expanded-panel" *ngIf="kb.isExpanded">
                <div class="panel-content">
                  <div class="panel-section files-section">
                    <h4>Files</h4>
                    <div class="files-list">
                      <div *ngFor="let file of kb.files" class="file-item">
                        <div class="file-info">
                          <span class="file-name">{{ file.name }}</span>
                          <span class="file-meta">
                            {{ formatBytes(file.size) }} • 
                            {{ file.uploadDate | date:'short' }}
                          </span>
                        </div>
                        <div class="file-status" [class]="file.status">
                          {{ file.status }}
                        </div>
                        <button class="remove-file-btn">×</button>
                      </div>
                      <div class="file-upload">
                        <button class="upload-btn">
                          <span>+ Add Files</span>
                          <input type="file" multiple class="file-input" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="panel-section settings-section">
                    <h4>Settings</h4>
                    <div class="settings-grid">
                      <div class="setting-item">
                        <label>Chunk Size</label>
                        <input type="number" [(ngModel)]="kb.settings.chunkSize" class="setting-input" />
                      </div>
                      <div class="setting-item">
                        <label>Chunk Overlap</label>
                        <input type="number" [(ngModel)]="kb.settings.chunkOverlap" class="setting-input" />
                      </div>
                      <div class="setting-item">
                        <label>Embedding Model</label>
                        <select [(ngModel)]="kb.settings.embeddingModel" class="setting-input">
                          <option value="openai">OpenAI</option>
                          <option value="huggingface">HuggingFace</option>
                          <option value="cohere">Cohere</option>
                        </select>
                      </div>
                      <div class="setting-item">
                        <label>Similarity Threshold</label>
                        <input 
                          type="range" 
                          [(ngModel)]="kb.settings.similarityThreshold" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          class="setting-input range" />
                        <span class="range-value">{{ kb.settings.similarityThreshold }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="panel-actions">
                  <button class="action-btn rebuild">
                    🔄 Rebuild Vectors
                  </button>
                  <button class="action-btn save">
                    💾 Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
      color: #fff;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
    }

    .tab-container {
      margin-bottom: 20px;
      border-bottom: 2px solid rgba(255, 20, 147, 0.2);
    }

    .tabs {
      display: flex;
      gap: 10px;
    }

    .tab-button {
      background: transparent;
      border: none;
      color: #fff;
      padding: 12px 24px;
      font-size: 16px;
      cursor: pointer;
      position: relative;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    .tab-button:hover {
      background: rgba(255, 20, 147, 0.1);
    }

    .tab-button.active {
      background: rgba(255, 20, 147, 0.2);
    }

    .tab-button.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: deeppink;
      box-shadow: 0 0 10px deeppink;
    }

    .tab-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(255, 20, 147, 0.2) 0%, transparent 70%);
      opacity: 0;
      transition: all 0.3s ease;
    }

    .tab-button:hover .tab-glow {
      width: 150px;
      height: 150px;
      opacity: 1;
    }

    .agents-tab {
      padding: 20px;
    }

    .agents-table {
      background: rgba(30, 30, 40, 0.7);
      border-radius: 8px;
      border: 1px solid rgba(255, 20, 147, 0.3);
      overflow: hidden;
    }

    .table-header, .agent-main-row {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 100px;
      padding: 15px;
      align-items: center;
    }

    .table-header {
      background: rgba(255, 20, 147, 0.1);
      font-weight: bold;
      border-bottom: 1px solid rgba(255, 20, 147, 0.2);
    }

    .table-header .col-channels {
      padding-left: 20px;
    }

    .col-agent {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .col-strategy {
      white-space: nowrap;
    }

    .col-channels {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .table-header > div {
      padding: 0 15px;
      text-align: left;
    }

    .col-agent {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 15px;
      width: 300px;
      min-width: 0;
    }

    .table-header .col-agent,
    .agent-main-row .col-agent {
      width: 300px;
      min-width: 0;
    }

    .col-strategy {
      padding: 0 15px;
      width: 100%;
      min-width: 0;
    }

    .col-channels {
      padding: 0 15px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      width: 100%;
      min-width: 0;
    }

    .col-actions {
      padding: 0 15px;
      text-align: right;
    }

    .agent-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .agent-row {
      border-bottom: 1px solid rgba(255, 20, 147, 0.1);
    }

    .agent-main-row:hover {
      background: rgba(255, 20, 147, 0.05);
    }

    .agent-main-row.expanded {
      background: rgba(255, 20, 147, 0.1);
    }

    .agent-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin-right: 10px;
      vertical-align: middle;
    }

    .manage-btn {
      background: transparent;
      border: 1px solid deeppink;
      color: deeppink;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .manage-btn:hover {
      background: deeppink;
      color: white;
    }

    .agent-expanded-panel {
      background: rgba(20, 20, 30, 0.95);
      padding: 20px;
      animation: slideDown 0.3s ease;
    }

    .panel-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .panel-section {
      padding: 15px;
      background: rgba(40, 40, 50, 0.5);
      border-radius: 8px;
      border: 1px solid rgba(255, 20, 147, 0.2);
    }

    .panel-section h4 {
      color: deeppink;
      margin-bottom: 10px;
      font-size: 1.1em;
    }

    .personality-input {
      width: 100%;
      min-height: 100px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 20, 147, 0.3);
      border-radius: 4px;
      color: white;
      padding: 10px;
      resize: vertical;
    }

    .knowledge-bases-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .knowledge-base-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }

    .remove-kb-btn {
      background: transparent;
      border: none;
      color: rgba(255, 20, 147, 0.7);
      cursor: pointer;
      font-size: 1.2em;
      padding: 0 5px;
    }

    .remove-kb-btn:hover {
      color: deeppink;
    }

    .add-kb-btn {
      background: transparent;
      border: 1px dashed rgba(255, 20, 147, 0.5);
      color: rgba(255, 20, 147, 0.7);
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.3s ease;
    }

    .add-kb-btn:hover {
      background: rgba(255, 20, 147, 0.1);
      color: deeppink;
    }

    .avatar-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .avatar-preview img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 2px solid rgba(255, 20, 147, 0.3);
    }

    .change-avatar-btn {
      background: transparent;
      border: 1px solid deeppink;
      color: deeppink;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .change-avatar-btn:hover {
      background: deeppink;
      color: white;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      animation: fadeIn 0.5s ease;
    }

    .info-card {
      background: rgba(30, 30, 40, 0.7);
      border: 1px solid rgba(255, 20, 147, 0.3);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 0 20px rgba(255, 20, 147, 0.1);
      backdrop-filter: blur(5px);
    }

    .info-card h3 {
      color: deeppink;
      margin-bottom: 15px;
      font-size: 1.2em;
      border-bottom: 1px solid rgba(255, 20, 147, 0.2);
      padding-bottom: 10px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    .info-item:hover {
      background: rgba(255, 20, 147, 0.1);
    }

    .error-message {
      color: #ff4444;
      padding: 20px;
      background: rgba(255, 68, 68, 0.1);
      border-radius: 8px;
      margin-top: 20px;
    }

    .tab-icon {
      font-style: normal;
      color: deeppink;
    }

    .vectors-tab {
      padding: 20px;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .vectors-table {
      background: rgba(30, 30, 40, 0.7);
      border-radius: 8px;
      border: 1px solid rgba(255, 20, 147, 0.3);
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 100px;
      padding: 15px;
      background: rgba(255, 20, 147, 0.1);
      font-weight: bold;
      border-bottom: 1px solid rgba(255, 20, 147, 0.2);
      align-items: center;
    }

    .agent-main-row {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 100px;
      padding: 15px;
      align-items: center;
    }

    .table-header .col-channels {
      padding-left: 20px;
    }

    .vector-row {
      border-bottom: 1px solid rgba(255, 20, 147, 0.1);
    }

    .vector-main-row {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 100px;
      padding: 15px;
      align-items: center;
      transition: background-color 0.3s ease;
    }

    .vector-main-row:hover {
      background: rgba(255, 20, 147, 0.05);
    }

    .vector-main-row.expanded {
      background: rgba(255, 20, 147, 0.1);
    }

    .kb-title {
      display: block;
      font-weight: bold;
      color: deeppink;
    }

    .kb-description {
      display: block;
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.7);
    }

    .vector-expanded-panel {
      background: rgba(20, 20, 30, 0.95);
      padding: 20px;
      animation: slideDown 0.3s ease;
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      transition: background-color 0.3s ease;
    }

    .file-item:hover {
      background: rgba(255, 20, 147, 0.1);
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .file-name {
      font-weight: bold;
    }

    .file-meta {
      font-size: 0.8em;
      color: rgba(255, 255, 255, 0.6);
    }

    .file-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .file-status.processed {
      background: rgba(0, 255, 0, 0.2);
      color: #90EE90;
    }

    .file-status.processing {
      background: rgba(255, 165, 0, 0.2);
      color: #FFB347;
    }

    .file-status.failed {
      background: rgba(255, 0, 0, 0.2);
      color: #FF6B6B;
    }

    .remove-file-btn {
      background: transparent;
      border: none;
      color: rgba(255, 20, 147, 0.7);
      cursor: pointer;
      font-size: 1.2em;
      padding: 0 5px;
      margin-left: 10px;
    }

    .remove-file-btn:hover {
      color: deeppink;
    }

    .file-upload {
      margin-top: 10px;
    }

    .upload-btn {
      position: relative;
      width: 100%;
      padding: 15px;
      background: rgba(255, 20, 147, 0.1);
      border: 2px dashed rgba(255, 20, 147, 0.3);
      border-radius: 4px;
      color: deeppink;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .upload-btn:hover {
      background: rgba(255, 20, 147, 0.2);
      border-color: deeppink;
    }

    .file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .setting-item label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9em;
    }

    .setting-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 20, 147, 0.3);
      border-radius: 4px;
      color: white;
      padding: 8px;
    }

    .setting-input:focus {
      border-color: deeppink;
      outline: none;
    }

    .setting-input.range {
      -webkit-appearance: none;
      height: 4px;
      background: rgba(255, 20, 147, 0.3);
      border-radius: 2px;
    }

    .setting-input.range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: deeppink;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .setting-input.range::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    .range-value {
      color: deeppink;
      font-size: 0.9em;
      text-align: center;
    }

    .panel-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 20, 147, 0.2);
    }

    .action-btn {
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      color: white;
      font-weight: bold;
    }

    .action-btn.rebuild {
      background: rgba(255, 165, 0, 0.3);
    }

    .action-btn.rebuild:hover {
      background: rgba(255, 165, 0, 0.5);
    }

    .action-btn.save {
      background: rgba(255, 20, 147, 0.3);
    }

    .action-btn.save:hover {
      background: rgba(255, 20, 147, 0.5);
    }

    .strategy-selector {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .strategy-description {
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.7);
      padding: 8px;
      background: rgba(255, 20, 147, 0.1);
      border-radius: 4px;
    }

    .channels-manager {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .current-channels {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .channel-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      background: rgba(255, 20, 147, 0.2);
      border-radius: 4px;
      font-size: 0.9em;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .channel-tag:hover {
      background: rgba(255, 20, 147, 0.3);
    }

    .remove-channel-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0 2px;
      font-size: 1.1em;
      line-height: 1;
      transition: all 0.3s ease;
    }

    .remove-channel-btn:hover {
      color: white;
    }

    .add-channel {
      display: flex;
      gap: 10px;
    }

    .add-channel-btn {
      background: rgba(255, 20, 147, 0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .add-channel-btn:hover:not(:disabled) {
      background: rgba(255, 20, 147, 0.4);
    }

    .add-channel-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .return-bar {
      margin: -20px -20px 20px -20px;
      padding: 15px 20px;
      background: rgba(255, 20, 147, 0.1);
      border-bottom: 1px solid rgba(255, 20, 147, 0.2);
    }

    .return-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: deeppink;
      text-decoration: none;
      font-size: 1.1em;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 4px;
      transition: all 0.3s ease;
      background: rgba(255, 20, 147, 0.1);
    }

    .return-button:hover {
      background: rgba(255, 20, 147, 0.2);
      transform: translateX(-5px);
    }

    .return-arrow {
      font-size: 1.4em;
      line-height: 1;
    }

    .table-header .col-channels {
      padding-left: 20px;
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class AdminDashboardComponent implements OnInit {
  systemInfo: SystemInfo | null = null;
  error: string | null = null;
  activeTab: string = 'info';

  tabs: AdminTab[] = [
    { id: 'info', label: 'System Info', icon: '♪' },
    { id: 'agents', label: 'AI Agents', icon: '🤖' },
    { id: 'vectors', label: 'Vector KBs', icon: '🧬' },
    { id: 'users', label: 'User Management', icon: '♫' },
    { id: 'logs', label: 'System Logs', icon: '♩' }
  ];

  // Dummy AI agents data
  aiAgents: AIAgent[] = [
    {
      id: '1',
      name: 'Support Agent',
      strategy: 'Customer Support',
      channels: ['#support', '#general'],
      personality: 'Friendly and helpful customer support agent with extensive knowledge of our products and services.',
      knowledgeBases: ['Product Documentation', 'FAQs', 'Troubleshooting Guide'],
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=support',
      isExpanded: false
    },
    {
      id: '2',
      name: 'Code Assistant',
      strategy: 'Programming Helper',
      channels: ['#development', '#code-review'],
      personality: 'Technical and precise programming assistant with expertise in multiple programming languages.',
      knowledgeBases: ['Code Samples', 'Best Practices', 'Language Documentation'],
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=code',
      isExpanded: false
    },
    {
      id: '3',
      name: 'Community Manager',
      strategy: 'Community Engagement',
      channels: ['#community', '#events', '#announcements'],
      personality: 'Engaging and enthusiastic community manager that helps maintain a positive atmosphere.',
      knowledgeBases: ['Community Guidelines', 'Event Calendar', 'User Profiles'],
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=community',
      isExpanded: false
    }
  ];

  // Dummy vector knowledge bases data
  vectorKBs: VectorKnowledgeBase[] = [
    {
      id: '1',
      title: 'Product Documentation',
      description: 'Complete product documentation including user guides and API references',
      files: [
        {
          id: 'f1',
          name: 'user-guide-v1.pdf',
          size: 2500000,
          type: 'application/pdf',
          uploadDate: new Date('2024-01-15'),
          status: 'processed'
        },
        {
          id: 'f2',
          name: 'api-documentation.md',
          size: 150000,
          type: 'text/markdown',
          uploadDate: new Date('2024-01-16'),
          status: 'processed'
        }
      ],
      settings: {
        chunkSize: 1000,
        chunkOverlap: 200,
        embeddingModel: 'openai',
        similarityThreshold: 0.7
      },
      lastUpdated: new Date('2024-01-16'),
      isExpanded: false
    },
    {
      id: '2',
      title: 'Support Knowledge Base',
      description: 'Common issues, troubleshooting guides, and FAQs',
      files: [
        {
          id: 'f3',
          name: 'troubleshooting-guide.pdf',
          size: 1800000,
          type: 'application/pdf',
          uploadDate: new Date('2024-01-14'),
          status: 'processed'
        },
        {
          id: 'f4',
          name: 'faq.md',
          size: 75000,
          type: 'text/markdown',
          uploadDate: new Date('2024-01-14'),
          status: 'processing'
        }
      ],
      settings: {
        chunkSize: 800,
        chunkOverlap: 150,
        embeddingModel: 'huggingface',
        similarityThreshold: 0.8
      },
      lastUpdated: new Date('2024-01-14'),
      isExpanded: false
    },
    {
      id: '3',
      title: 'Community Guidelines',
      description: 'Community rules, best practices, and moderation guidelines',
      files: [
        {
          id: 'f5',
          name: 'community-guidelines.md',
          size: 120000,
          type: 'text/markdown',
          uploadDate: new Date('2024-01-10'),
          status: 'processed'
        },
        {
          id: 'f6',
          name: 'moderation-handbook.pdf',
          size: 3200000,
          type: 'application/pdf',
          uploadDate: new Date('2024-01-12'),
          status: 'failed'
        }
      ],
      settings: {
        chunkSize: 500,
        chunkOverlap: 100,
        embeddingModel: 'cohere',
        similarityThreshold: 0.6
      },
      lastUpdated: new Date('2024-01-12'),
      isExpanded: false
    }
  ];

  // Predefined strategies
  strategies: Strategy[] = [
    {
      id: 'support',
      name: 'Customer Support',
      description: 'Handles customer inquiries and provides support assistance'
    },
    {
      id: 'code',
      name: 'Programming Helper',
      description: 'Assists with code reviews, debugging, and development questions'
    },
    {
      id: 'community',
      name: 'Community Manager',
      description: 'Moderates discussions and helps maintain community guidelines'
    },
    {
      id: 'documentation',
      name: 'Documentation Assistant',
      description: 'Helps users find and understand documentation'
    },
    {
      id: 'onboarding',
      name: 'Onboarding Guide',
      description: 'Assists new users with getting started and platform navigation'
    }
  ];

  // Available channels (in a real app, this would come from your backend)
  availableChannels: string[] = [
    '#general',
    '#support',
    '#development',
    '#code-review',
    '#community',
    '#documentation',
    '#onboarding',
    '#announcements',
    '#help'
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadSystemInfo();
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  toggleAgentExpand(agent: AIAgent) {
    agent.isExpanded = !agent.isExpanded;
  }

  loadSystemInfo() {
    this.adminService.getSystemInfo().subscribe({
      next: (info) => {
        this.systemInfo = info;
        this.error = null;
      },
      error: (err) => {
        console.error('Error loading system info:', err);
        this.error = 'Failed to load system information. Please try again later.';
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts = [];
    
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '< 1m';
  }

  toggleVectorKBExpand(kb: VectorKnowledgeBase) {
    kb.isExpanded = !kb.isExpanded;
  }

  getStrategyDescription(strategyName: string): string {
    const strategy = this.strategies.find(s => s.name === strategyName);
    return strategy?.description || '';
  }

  getAvailableChannels(agent: AIAgent): string[] {
    return this.availableChannels.filter(channel => !agent.channels.includes(channel));
  }

  removeChannel(agent: AIAgent, channel: string) {
    agent.channels = agent.channels.filter(ch => ch !== channel);
  }

  addChannel(agent: AIAgent) {
    if (agent.newChannel && !agent.channels.includes(agent.newChannel)) {
      agent.channels.push(agent.newChannel);
      agent.newChannel = ''; // Reset the selection
    }
  }
} 