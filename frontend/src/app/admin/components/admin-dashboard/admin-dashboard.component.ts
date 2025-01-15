import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemInfo, AiAgentDetails, Channel } from '../../services/admin.service';
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

  MeyersBriggsType = MeyersBriggsType;
  Object = Object;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadSystemInfo();
    this.loadAiAgents();
    this.loadChannels();
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
    kb.isExpanded = !kb.isExpanded;
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

  removeChannel(agent: AIAgent, channel: string) {
    agent.channels = agent.channels.filter(ch => ch !== channel);
  }

  addChannel(agent: AIAgent) {
    if (agent.newChannel && !agent.channels.includes(agent.newChannel)) {
      agent.channels.push(agent.newChannel);
      agent.newChannel = ''; // Reset the selection
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

  updateAgentPersonality(agent: AIAgent) {
    if (!agent.personality) return;

    this.adminService.updateAiAgentPersonality(agent.id, agent.personality).subscribe({
      next: (updatedPersonality) => {
        console.log('Personality updated successfully:', updatedPersonality);
        // Update the local agent data with the response
        agent.personality = updatedPersonality;
      },
      error: (err) => {
        console.error('Error updating personality:', err);
        // You might want to show an error message to the user here
      }
    });
  }
} 