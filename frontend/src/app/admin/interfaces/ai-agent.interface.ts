export enum MeyersBriggsType {
  INTJ = 'INTJ',
  INTP = 'INTP',
  ENTJ = 'ENTJ',
  ENTP = 'ENTP',
  INFJ = 'INFJ',
  INFP = 'INFP',
  ENFJ = 'ENFJ',
  ENFP = 'ENFP',
  ISTJ = 'ISTJ',
  ISFJ = 'ISFJ',
  ESTJ = 'ESTJ',
  ESFJ = 'ESFJ',
  ISTP = 'ISTP',
  ISFP = 'ISFP',
  ESTP = 'ESTP',
  ESFP = 'ESFP'
}

export interface AiAgentPersonality {
  generalPersonality: string;
  meyersBriggs: MeyersBriggsType;
  writingStyle: string;
  displayName: string;
  contactEmail: string;
}

export interface AIAgent {
  id: string;
  name: string;
  strategy: string;
  channels: string[];
  avatarUrl: string;
  isExpanded: boolean;
  newChannel: string;
  personality?: AiAgentPersonality;
  knowledgeBases: string[];
} 