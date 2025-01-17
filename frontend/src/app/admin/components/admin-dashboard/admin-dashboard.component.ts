import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemInfo, AiAgentDetails, Channel, VectorKnowledgeBase, CorpusFile } from '../../services/admin.service';
import { AIAgent, MeyersBriggsType, AiAgentPersonality } from '../../interfaces/ai-agent.interface';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/interfaces/user.interface';
import { firstValueFrom } from 'rxjs';

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

  uploadingFiles: { [kbId: string]: boolean } = {};
  fileUploadError: { [kbId: string]: string | null } = {};

  private uploadingKBs = new Set<string>();
  private uploadErrors = new Map<string, string>();
  private processingKBs = new Set<string>();
  private rebuildingKBs = new Set<string>();
  private unsavedKBUsage = new Set<string>();
  kbSaveNotifications: { [kbId: string]: SaveNotification | null } = {};
  private unsavedKBSettings = new Set<string>();
  kbSettingsNotifications: { [kbId: string]: SaveNotification | null } = {};

  // Add Agent Modal
  showingAddAgentModal = false;
  newAgent = {
    username: '',
    email: ''
  };
  addAgentError: string | null = null;

  // Add Knowledge Base Modal
  showingAddKBModal = false;
  newKnowledgeBase = {
    name: '',
    description: ''
  };
  addKBError: string | null = null;

  // Track knowledge base changes for each agent
  knowledgeBaseChanges: { [agentId: string]: { added: string[]; removed: string[]; } } = {};

  // Properties for managing selected users
  users: User[] = [];
  selectedUsers: { [kbId: string]: User[] } = {};
  searchTerm: { [kbId: string]: string } = {};
  filteredUsers: { [kbId: string]: User[] } = {};

  // Properties for managing chat history users
  chatHistoryUsers: { [kbId: string]: User[] } = {};
  loadingChatHistoryUsers: { [kbId: string]: boolean } = {};
  chatHistoryError: { [kbId: string]: string | null } = {};

  constructor(
    private adminService: AdminService,
    private apiService: ApiService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSystemInfo();
    this.loadAiAgents();
    this.loadChannels();
    this.loadVectorKnowledgeBases();
    this.loadUsers();
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
        contactEmail: agent.email || '',
        instructions: '',
        maxHourlyResponses: 100
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
    const isCurrentlyExpanded = this.expandedKBs[kb.id];
    this.expandedKBs[kb.id] = !isCurrentlyExpanded;

    if (!isCurrentlyExpanded) {
      // Load chat history users when expanding
      this.loadChatHistoryUsers(kb);
    }
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
        console.log('Raw AI Agents loaded from backend:', agents);
        console.log('First agent personality:', agents[0]?.personality);
        
        this.aiAgents = agents.map(agent => {
          console.log(`Mapping agent ${agent.username}, personality:`, agent.personality);
          
          return {
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
              contactEmail: agent.email || '',
              instructions: '',
              maxHourlyResponses: 100
            },
            knowledgeBases: agent.knowledgeBases || [],
            avatarUrl: agent.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.id}`,
            isExpanded: false,
            newChannel: '',
            newKnowledgeBase: ''
          };
        });
        
        console.log('Mapped AI Agents:', this.aiAgents);
        console.log('First mapped agent personality:', this.aiAgents[0]?.personality);
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
        console.log('Loaded vector knowledge bases:', kbs);
        console.log('First KB corpus files:', kbs[0]?.corpusFiles);
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

  onPersonalityChange(agent: AIAgent) {
    this.markAsUnsaved(agent);
    this.changeDetector.detectChanges();
  }

  saveAgentPersonality(agent: AIAgent) {
    if (!agent.personality) return;

    // Clear any existing notification
    this.saveNotifications[agent.id] = null;

    // Get channel changes for this agent
    const channelChanges = this.channelChanges[agent.id] || { added: [], removed: [] };
    
    // Get knowledge base changes for this agent
    const kbChanges = this.knowledgeBaseChanges[agent.id] || { added: [], removed: [] };

    this.adminService.saveAgentChanges(
      agent.id,
      agent.personality,
      channelChanges.added,
      channelChanges.removed,
      kbChanges.added,
      kbChanges.removed
    ).subscribe({
      next: () => {
        console.log('Changes saved successfully');
        // Clear unsaved changes flag
        this.unsavedChanges[agent.id] = false;
        // Clear channel changes
        this.channelChanges[agent.id] = { added: [], removed: [] };
        // Clear knowledge base changes
        this.knowledgeBaseChanges[agent.id] = { added: [], removed: [] };
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

  async onFileSelected(event: Event, kb: VectorKnowledgeBase) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    console.log('Selected file:', { name: file.name, type: file.type, size: file.size });

    if (!file.type.includes('text/')) {
      this.fileUploadError[kb.id] = 'Only text files are allowed';
      return;
    }

    this.uploadingFiles[kb.id] = true;
    this.fileUploadError[kb.id] = null;

    try {
      console.log('Getting presigned URL for file upload...');
      // Get presigned URL
      const { uploadUrl, file: fileMetadata } = await firstValueFrom(
        this.adminService.getUploadUrl(kb.id, file)
      );
      console.log('Got presigned URL:', uploadUrl);
      console.log('File metadata:', fileMetadata);
      
      // Upload to S3
      console.log('Uploading file to S3...');
      await firstValueFrom(this.adminService.uploadFileToS3(uploadUrl, file));
      console.log('Successfully uploaded file to S3');
      
      // Initialize corpusFiles array if needed
      if (!kb.corpusFiles) {
        kb.corpusFiles = [];
      }
      
      // Add file to the list
      kb.corpusFiles.push(fileMetadata);
      console.log('Updated knowledge base files:', kb.corpusFiles);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      this.fileUploadError[kb.id] = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
    } finally {
      this.uploadingFiles[kb.id] = false;
      // Clear the input
      input.value = '';
    }
  }

  isUploading(kb: VectorKnowledgeBase): boolean {
    return this.uploadingFiles[kb.id] || false;
  }

  getUploadError(kb: VectorKnowledgeBase): string | null {
    return this.fileUploadError[kb.id] || null;
  }

  clearUploadError(kb: VectorKnowledgeBase) {
    this.fileUploadError[kb.id] = null;
  }

  triggerFileInput(kb: VectorKnowledgeBase) {
    this.clearUploadError(kb);
    const fileInput = document.getElementById(`file-upload-${kb.id}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  async removeCorpusFile(kb: VectorKnowledgeBase, file: CorpusFile) {
    try {
      await firstValueFrom(this.adminService.removeCorpusFile(kb.id, file.id));
      // Remove the file from the list
      kb.corpusFiles = kb.corpusFiles.filter(f => f.id !== file.id);
      // Set needsRebuild flag immediately
      kb.needsRebuild = true;
      this.changeDetector.detectChanges();
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }

  hasUnprocessedFiles(kb: VectorKnowledgeBase): boolean {
    return kb.corpusFiles?.some(file => !file.processed) ?? false;
  }

  isProcessing(kb: VectorKnowledgeBase): boolean {
    return this.processingKBs.has(kb.id);
  }

  async processFiles(kb: VectorKnowledgeBase): Promise<void> {
    if (this.isProcessing(kb)) return;

    this.processingKBs.add(kb.id);
    try {
      await firstValueFrom(this.adminService.processVectorKnowledgeBase(kb.id));
      // Refresh the knowledge base to get updated processing status
      const updatedKBs = await firstValueFrom(this.adminService.getAllVectorKnowledgeBases());
      const updatedKB = updatedKBs.find(k => k.id === kb.id);
      if (updatedKB) {
        Object.assign(kb, updatedKB);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      this.processingKBs.delete(kb.id);
      this.changeDetector.detectChanges();
    }
  }

  needsRebuild(kb: VectorKnowledgeBase): boolean {
    return kb.needsRebuild || false;
  }

  isRebuilding(kb: VectorKnowledgeBase): boolean {
    return this.rebuildingKBs.has(kb.id);
  }

  async rebuildKnowledgeBase(kb: VectorKnowledgeBase): Promise<void> {
    if (this.isRebuilding(kb)) return;

    if (!confirm('This will clear all embeddings from the knowledge base. You will need to process the files again afterward. Continue?')) {
      return;
    }

    this.rebuildingKBs.add(kb.id);
    try {
      // Clear the knowledge base
      await firstValueFrom(this.adminService.rebuildKnowledgeBase(kb.id));
      
      // Mark all files as unprocessed locally
      if (kb.corpusFiles) {
        kb.corpusFiles.forEach(file => file.processed = false);
      }
      
      // Refresh the knowledge base to get updated status
      const updatedKBs = await firstValueFrom(this.adminService.getAllVectorKnowledgeBases());
      const updatedKB = updatedKBs.find(k => k.id === kb.id);
      if (updatedKB) {
        Object.assign(kb, updatedKB);
      }

      // The "Process Unprocessed Files" button should now appear since files are marked as unprocessed
      this.changeDetector.detectChanges();
    } catch (error) {
      console.error('Error clearing knowledge base:', error);
    } finally {
      this.rebuildingKBs.delete(kb.id);
      this.changeDetector.detectChanges();
    }
  }

  hasUnsavedUsage(kb: VectorKnowledgeBase): boolean {
    return this.unsavedKBUsage.has(kb.id);
  }

  onUsageChange(kb: VectorKnowledgeBase) {
    this.unsavedKBUsage.add(kb.id);
  }

  getKBSaveNotification(kb: VectorKnowledgeBase): SaveNotification | null {
    return this.kbSaveNotifications[kb.id] || null;
  }

  async saveKnowledgeBaseUsage(kb: VectorKnowledgeBase) {
    try {
      await firstValueFrom(this.adminService.updateVectorKnowledgeBase(kb.id, { usage: kb.usage }));
      this.unsavedKBUsage.delete(kb.id);
      
      // Show success notification
      this.kbSaveNotifications[kb.id] = {
        type: 'success',
        message: 'Usage saved successfully!'
      };
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        this.kbSaveNotifications[kb.id] = null;
        this.changeDetector.detectChanges();
      }, 3000);
      
      this.changeDetector.detectChanges();
    } catch (error) {
      console.error('Error saving knowledge base usage:', error);
      
      // Show error notification
      this.kbSaveNotifications[kb.id] = {
        type: 'error',
        message: 'Failed to save usage. Please try again.'
      };
      this.changeDetector.detectChanges();
    }
  }

  onChunkingSettingsChange(kb: VectorKnowledgeBase) {
    this.unsavedKBSettings.add(kb.id);
    this.changeDetector.detectChanges();
  }

  hasUnsavedSettings(kb: VectorKnowledgeBase): boolean {
    return this.unsavedKBSettings.has(kb.id);
  }

  async saveKnowledgeBaseSettings(kb: VectorKnowledgeBase): Promise<void> {
    try {
      const updates = {
        chunkingStrategy: kb.chunkingStrategy,
        chunkingSettings: kb.chunkingSettings
      };

      await firstValueFrom(this.adminService.updateVectorKnowledgeBase(kb.id, updates));
      
      this.unsavedKBSettings.delete(kb.id);
      this.kbSettingsNotifications[kb.id] = {
        type: 'success',
        message: 'Settings saved successfully!'
      };

      setTimeout(() => {
        this.kbSettingsNotifications[kb.id] = null;
        this.changeDetector.detectChanges();
      }, 3000);

    } catch (error) {
      console.error('Error saving knowledge base settings:', error);
      this.kbSettingsNotifications[kb.id] = {
        type: 'error',
        message: 'Failed to save settings. Please try again.'
      };
    }
    this.changeDetector.detectChanges();
  }

  getKBSettingsNotification(kb: VectorKnowledgeBase): SaveNotification | null {
    return this.kbSettingsNotifications[kb.id] || null;
  }

  showAddAgentModal() {
    this.showingAddAgentModal = true;
    this.newAgent = {
      username: '',
      email: ''
    };
    this.addAgentError = null;
  }

  hideAddAgentModal() {
    this.showingAddAgentModal = false;
    this.addAgentError = null;
  }

  async createAgent() {
    if (!this.newAgent.username || !this.newAgent.email) {
      this.addAgentError = 'Please fill in all fields';
      return;
    }

    try {
      const agent = await firstValueFrom(
        this.adminService.createAiAgent(this.newAgent.username, this.newAgent.email)
      );
      
      // Refresh the agents list
      this.loadAiAgents();
      
      // Close the modal
      this.hideAddAgentModal();
    } catch (error) {
      console.error('Error creating AI agent:', error);
      this.addAgentError = error instanceof Error ? error.message : 'Failed to create agent. Please try again.';
    }
  }

  addKnowledgeBase(agent: AIAgent, knowledgeBaseId: string) {
    if (!agent.knowledgeBases.some(kb => kb.id === knowledgeBaseId)) {
      // Find the knowledge base details
      const kb = this.vectorKBs.find(kb => kb.id === knowledgeBaseId);
      if (!kb) return;

      // Add to UI immediately
      agent.knowledgeBases.push({
        id: kb.id,
        name: kb.name
      });
      
      // Track the change
      if (!this.knowledgeBaseChanges[agent.id]) {
        this.knowledgeBaseChanges[agent.id] = { added: [], removed: [] };
      }
      this.knowledgeBaseChanges[agent.id].added.push(knowledgeBaseId);
      
      // Mark as unsaved
      this.markAsUnsaved(agent);

      // Reset selection
      agent.newKnowledgeBase = '';
    }
  }

  removeKnowledgeBase(agent: AIAgent, knowledgeBaseId: string) {
    const index = agent.knowledgeBases.findIndex(kb => kb.id === knowledgeBaseId);
    if (index > -1) {
      // Remove from UI immediately
      agent.knowledgeBases.splice(index, 1);
      
      // Track the change
      if (!this.knowledgeBaseChanges[agent.id]) {
        this.knowledgeBaseChanges[agent.id] = { added: [], removed: [] };
      }
      this.knowledgeBaseChanges[agent.id].removed.push(knowledgeBaseId);
      
      // Mark as unsaved
      this.markAsUnsaved(agent);
    }
  }

  showAddKBModal() {
    this.showingAddKBModal = true;
    this.newKnowledgeBase = {
      name: '',
      description: ''
    };
    this.addKBError = null;
  }

  hideAddKBModal() {
    this.showingAddKBModal = false;
    this.addKBError = null;
  }

  async createKnowledgeBase() {
    if (!this.newKnowledgeBase.name) {
      this.addKBError = 'Please enter a name for the knowledge base';
      return;
    }

    try {
      const kb = await firstValueFrom(
        this.adminService.createVectorKnowledgeBase(
          this.newKnowledgeBase.name,
          this.newKnowledgeBase.description
        )
      );
      
      // Refresh the knowledge bases list
      this.loadVectorKnowledgeBases();
      
      // Close the modal
      this.hideAddKBModal();
    } catch (error) {
      console.error('Error creating vector knowledge base:', error);
      this.addKBError = error instanceof Error ? error.message : 'Failed to create knowledge base. Please try again.';
    }
  }

  private async loadUsers() {
    try {
      this.users = await firstValueFrom(this.apiService.getAllUsers());
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  filterUsers(kb: VectorKnowledgeBase) {
    const term = this.searchTerm[kb.id]?.toLowerCase() || '';
    this.filteredUsers[kb.id] = this.users.filter(user => 
      !this.isChatHistoryUser(kb, user) && 
      (user.username.toLowerCase().includes(term) || 
       user.email?.toLowerCase().includes(term))
    );
  }

  isChatHistoryUser(kb: VectorKnowledgeBase, user: User): boolean {
    return (this.chatHistoryUsers[kb.id] || []).some(u => u.id === user.id);
  }

  addUser(kb: VectorKnowledgeBase, user: User) {
    if (!this.selectedUsers[kb.id]) {
      this.selectedUsers[kb.id] = [];
    }
    this.selectedUsers[kb.id].push(user);
    this.searchTerm[kb.id] = '';
    this.filterUsers(kb);
  }

  removeUser(kb: VectorKnowledgeBase, user: User) {
    this.selectedUsers[kb.id] = this.selectedUsers[kb.id].filter(u => u.id !== user.id);
    this.filterUsers(kb);
  }

  async loadChatHistoryUsers(kb: VectorKnowledgeBase) {
    this.loadingChatHistoryUsers[kb.id] = true;
    this.chatHistoryError[kb.id] = null;

    try {
      const users = await firstValueFrom(this.adminService.getChatHistoryUsers(kb.id));
      this.chatHistoryUsers[kb.id] = users;
    } catch (error) {
      console.error('Error loading chat history users:', error);
      this.chatHistoryError[kb.id] = 'Failed to load chat history users';
    } finally {
      this.loadingChatHistoryUsers[kb.id] = false;
    }
  }

  async addUserToChatHistory(kb: VectorKnowledgeBase, user: User) {
    try {
      await firstValueFrom(this.adminService.addChatHistoryUser(kb.id, user.id));
      await this.loadChatHistoryUsers(kb); // Reload the list
    } catch (error) {
      console.error('Error adding user to chat history:', error);
      this.chatHistoryError[kb.id] = 'Failed to add user to chat history';
    }
  }

  async removeUserFromChatHistory(kb: VectorKnowledgeBase, user: User) {
    try {
      await firstValueFrom(this.adminService.removeChatHistoryUser(kb.id, user.id));
      await this.loadChatHistoryUsers(kb); // Reload the list
    } catch (error) {
      console.error('Error removing user from chat history:', error);
      this.chatHistoryError[kb.id] = 'Failed to remove user from chat history';
    }
  }
} 