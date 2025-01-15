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
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
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