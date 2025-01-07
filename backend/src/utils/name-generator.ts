import { Injectable } from '@nestjs/common';

@Injectable()
export class NameGenerator {
  private readonly adjectives = [
    // Colors & Nature
    'blue', 'jade', 'ruby', 'sage', 'coral', 'moss', 'storm', 'frost',
    'amber', 'azure', 'pearl', 'gold', 'silver', 'crystal', 'emerald', 'violet',
    'misty', 'sunny', 'rainy', 'foggy', 'icy', 'dewy', 'dusty', 'breezy',
    
    // Cosmic & Mystical
    'astral', 'lunar', 'solar', 'cosmic', 'mystic', 'dream', 'star', 'void',
    'nebula', 'quantum', 'stellar', 'cosmic', 'ethereal', 'celestial', 'aurora', 'nova',
    'galactic', 'infinity', 'eternal', 'phantom', 'spirit', 'oracle', 'destiny', 'fate',
    
    // Emotions & Traits
    'happy', 'swift', 'wild', 'calm', 'zen', 'bold', 'pure', 'free',
    'brave', 'silent', 'gentle', 'bright', 'quiet', 'vivid', 'mellow', 'serene',
    'lucid', 'nimble', 'noble', 'wise', 'kind', 'fair', 'keen', 'grand'
  ];

  private readonly nouns = [
    // Animals
    'wolf', 'fox', 'bear', 'owl', 'swan', 'deer', 'hawk', 'dove',
    'raven', 'tiger', 'lion', 'lynx', 'eagle', 'phoenix', 'dragon', 'griffin',
    'panda', 'koala', 'otter', 'rabbit', 'falcon', 'dolphin', 'whale', 'seal',
    
    // Nature & Cosmic
    'wave', 'leaf', 'wind', 'rain', 'moon', 'sun', 'tree', 'rose',
    'stone', 'crystal', 'flower', 'garden', 'meadow', 'forest', 'river', 'ocean',
    'star', 'comet', 'planet', 'meteor', 'nebula', 'galaxy', 'aurora', 'dawn'
  ];

  private readonly verbs = [
    // Movement & Energy
    'dance', 'flow', 'drift', 'float', 'glide', 'soar', 'leap', 'dash',
    'glow', 'shine', 'spark', 'flash', 'beam', 'gleam', 'flare', 'blaze',
    'pulse', 'fade', 'flicker', 'shimmer', 'radiate', 'glitter', 'twinkle', 'sparkle',
    
    // Nature & Abstract
    'bloom', 'grow', 'flow', 'wave', 'rain', 'storm', 'snow', 'dream',
    'wish', 'hope', 'seek', 'wander', 'roam', 'quest', 'journey', 'vibe'
  ];

  generateNickname(seed: string): string {
    const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const adjIndex = seedNum % this.adjectives.length;
    const nounIndex = (seedNum * 7) % this.nouns.length;
    const verbIndex = (seedNum * 13) % this.verbs.length;
    
    const pattern = seedNum % 4;
    
    switch (pattern) {
      case 0:
        return `${this.adjectives[adjIndex]}${this.capitalize(this.nouns[nounIndex])}`;
      case 1:
        return `${this.verbs[verbIndex]}${this.capitalize(this.nouns[nounIndex])}`;
      case 2:
        return `${this.adjectives[adjIndex]}${this.capitalize(this.verbs[verbIndex])}`;
      case 3:
        return `${this.verbs[verbIndex]}${this.capitalize(this.adjectives[adjIndex])}`;
      default:
        return `${this.adjectives[adjIndex]}${this.capitalize(this.nouns[nounIndex])}`;
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
} 