import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemInfo, AiAgentDetails, Channel, VectorKnowledgeBase } from '../../services/admin.service';
import { AIAgent, MeyersBriggsType, AiAgentPersonality } from '../../interfaces/ai-agent.interface';

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

interface VectorFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: 'processed' | 'processing' | 'failed';
}

interface SaveNotification {
  type: 'success' | 'error';
  message: string;
}

interface ChannelChanges {
  added: string[];
  removed: string[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class AdminDashboardComponent implements OnInit {
  systemInfo: SystemInfo | null = null;
  error: string | null = null;
  activeTab: string = 'info';
  channels: Channel[] = [];
  expandedKBs: { [id: string]: boolean } = {};

  tabs: AdminTab[] = [
    { id: 'info', label: 'System Info', icon: '♪' },
    { id: 'agents', label: 'AI Agents', icon: '🤖' },
    { id: 'vectors', label: 'Vector KBs', icon: '🧬' },
    { id: 'users', label: 'User Management', icon: '♫' },
    { id: 'logs', label: 'System Logs', icon: '♩' }
  ];

  // Dummy AI agents data
  aiAgents: AIAgent[] = [];

  // Dummy vector knowledge bases data
  vectorKBs: VectorKnowledgeBase[] = [];

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

  MeyersBriggsType = MeyersBriggsType;
  Object = Object;

  // Track unsaved changes for each agent
  unsavedChanges: { [agentId: string]: boolean } = {};

  // Track save notifications for each agent
  saveNotifications: { [agentId: string]: SaveNotification | null } = {};

  // Track channel changes for each agent
  channelChanges: { [agentId: string]: ChannelChanges } = {};

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadSystemInfo();
    this.loadAiAgents();
    this.loadChannels();
    this.loadVectorKnowledgeBases();
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
  }

  toggleAgentExpand(agent: AIAgent) {
    agent.isExpanded = !agent.isExpanded;
    
    if (agent.isExpanded && !agent.personality) {
      agent.personality = {
        generalPersonality: 'Default personality description',
        meyersBriggs: MeyersBriggsType.INTP,
        writingStyle: 'Professional and concise',
        displayName: agent.name,
        contactEmail: agent.email || ''
      };
    }
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
    this.expandedKBs[kb.id] = !this.expandedKBs[kb.id];
  }

  isVectorKBExpanded(kb: VectorKnowledgeBase): boolean {
    return this.expandedKBs[kb.id] || false;
  }

  getStrategyDescription(strategyName: string): string {
    const strategy = this.strategies.find(s => s.name === strategyName);
    return strategy?.description || '';
  }

  getAvailableChannels(agent: AIAgent): string[] {
    return this.channels
      .filter(channel => !agent.channels.includes(channel.name))
      .map(channel => channel.name);
  }

  removeChannel(agent: AIAgent, channelName: string) {
    // Remove from UI immediately
    agent.channels = agent.channels.filter(ch => ch !== channelName);
    
    // Track the change
    if (!this.channelChanges[agent.id]) {
      this.channelChanges[agent.id] = { added: [], removed: [] };
    }
    const channelId = this.channels.find(c => c.name === channelName)?.id;
    if (channelId) {
      // If it was previously added, just remove from added list
      const addedIndex = this.channelChanges[agent.id].added.indexOf(channelId);
      if (addedIndex !== -1) {
        this.channelChanges[agent.id].added.splice(addedIndex, 1);
      } else {
        // Otherwise add to removed list
        this.channelChanges[agent.id].removed.push(channelId);
      }
    }
    
    // Mark as unsaved
    this.markAsUnsaved(agent);
  }

  addChannel(agent: AIAgent) {
    if (agent.newChannel && !agent.channels.includes(agent.newChannel)) {
      // Add to UI immediately
      agent.channels.push(agent.newChannel);
      
      // Track the change
      if (!this.channelChanges[agent.id]) {
        this.channelChanges[agent.id] = { added: [], removed: [] };
      }
      this.channelChanges[agent.id].added.push(
        this.channels.find(c => c.name === agent.newChannel)?.id || ''
      );
      
      // Mark as unsaved
      this.markAsUnsaved(agent);
      
      // Reset selection
      agent.newChannel = '';
    }
  }

  private loadAiAgents() {
    this.adminService.getAiAgents().subscribe({
      next: (agents) => {
        console.log('AI Agents loaded:', agents);
        this.aiAgents = agents.map(agent => ({
          id: agent.id,
          name: agent.username,
          email: agent.email,
          strategy: agent.strategy?.name || 'No Strategy',
          channels: agent.channels.map(ch => ch.name),
          personality: agent.personality || {
            generalPersonality: 'Default personality description',
            meyersBriggs: MeyersBriggsType.INTP,
            writingStyle: 'Professional and concise',
            displayName: agent.username,
            contactEmail: agent.email || ''
          },
          knowledgeBases: ['General Knowledge'],
          avatarUrl: agent.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.id}`,
          isExpanded: false,
          newChannel: ''
        }));
      },
      error: (err) => {
        console.error('Error loading AI agents:', err);
      }
    });
  }

  private loadChannels() {
    this.adminService.getAllChannels().subscribe({
      next: (channels) => {
        this.channels = channels;
      },
      error: (err) => {
        console.error('Error loading channels:', err);
      }
    });
  }

  private loadVectorKnowledgeBases() {
    this.adminService.getAllVectorKnowledgeBases().subscribe({
      next: (kbs) => {
        this.vectorKBs = kbs;
      },
      error: (err) => {
        console.error('Error loading vector knowledge bases:', err);
      }
    });
  }

  markAsUnsaved(agent: AIAgent) {
    this.unsavedChanges[agent.id] = true;
  }

  hasUnsavedChanges(agent: AIAgent): boolean {
    return this.unsavedChanges[agent.id] || false;
  }

  saveAgentPersonality(agent: AIAgent) {
    if (!agent.personality) return;

    // Clear any existing notification
    this.saveNotifications[agent.id] = null;

    // Get channel changes for this agent
    const changes = this.channelChanges[agent.id] || { added: [], removed: [] };

    this.adminService.saveAgentChanges(
      agent.id,
      agent.personality,
      changes.added,
      changes.removed
    ).subscribe({
      next: () => {
        console.log('Changes saved successfully');
        // Clear unsaved changes flag
        this.unsavedChanges[agent.id] = false;
        // Clear channel changes
        this.channelChanges[agent.id] = { added: [], removed: [] };
        // Show success notification
        this.saveNotifications[agent.id] = {
          type: 'success',
          message: 'Changes saved successfully!'
        };
        // Clear notification after 3 seconds
        setTimeout(() => {
          this.saveNotifications[agent.id] = null;
        }, 3000);
      },
      error: (err) => {
        console.error('Error saving changes:', err);
        // Show error notification
        this.saveNotifications[agent.id] = {
          type: 'error',
          message: 'Failed to save changes. Please try again.'
        };
      }
    });
  }

  // Helper method to get notification for an agent
  getSaveNotification(agent: AIAgent): SaveNotification | null {
    return this.saveNotifications[agent.id] || null;
  }
} 