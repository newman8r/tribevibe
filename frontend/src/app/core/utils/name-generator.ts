// Word lists for nickname generation
const adjectives = [
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
  'lucid', 'nimble', 'noble', 'wise', 'kind', 'fair', 'keen', 'grand',
  
  // Elements & Energy
  'fire', 'water', 'earth', 'wind', 'light', 'shadow', 'spark', 'flame',
  'ocean', 'river', 'mountain', 'forest', 'desert', 'cloud', 'thunder', 'lightning'
];

const nouns = [
  // Animals
  'wolf', 'fox', 'bear', 'owl', 'swan', 'deer', 'hawk', 'dove',
  'raven', 'tiger', 'lion', 'lynx', 'eagle', 'phoenix', 'dragon', 'griffin',
  'panda', 'koala', 'otter', 'rabbit', 'falcon', 'dolphin', 'whale', 'seal',
  'cat', 'panther', 'leopard', 'wolf', 'cobra', 'viper', 'turtle', 'crane',
  
  // Nature
  'wave', 'leaf', 'wind', 'rain', 'moon', 'sun', 'tree', 'rose',
  'stone', 'crystal', 'flower', 'garden', 'meadow', 'forest', 'river', 'ocean',
  'mountain', 'valley', 'canyon', 'desert', 'island', 'aurora', 'dawn', 'dusk',
  'storm', 'cloud', 'star', 'comet', 'planet', 'meteor', 'nebula', 'galaxy',
  
  // Cosmic & Mystical
  'soul', 'spirit', 'echo', 'pulse', 'aura', 'nova', 'comet', 'star',
  'dream', 'wish', 'hope', 'fate', 'destiny', 'oracle', 'prophet', 'sage',
  'mystic', 'wizard', 'witch', 'seer', 'knight', 'warrior', 'hunter', 'seeker',
  
  // Music & Sound
  'song', 'tune', 'chord', 'note', 'rhythm', 'beat', 'melody', 'hymn',
  'symphony', 'harmony', 'chorus', 'voice', 'echo', 'whisper', 'sound', 'tone'
];

const verbs = [
  // Movement
  'dance', 'flow', 'drift', 'float', 'glide', 'soar', 'leap', 'dash',
  'rush', 'sweep', 'swing', 'spin', 'twirl', 'skip', 'bounce', 'slide',
  'surf', 'dive', 'climb', 'jump', 'run', 'fly', 'hover', 'cruise',
  
  // Light & Energy
  'glow', 'shine', 'spark', 'flash', 'beam', 'gleam', 'flare', 'blaze',
  'pulse', 'fade', 'flicker', 'shimmer', 'radiate', 'glitter', 'twinkle', 'sparkle',
  
  // Nature & Elements
  'bloom', 'grow', 'flow', 'wave', 'rain', 'storm', 'snow', 'freeze',
  'melt', 'rise', 'fall', 'blow', 'swirl', 'spiral', 'ripple', 'cascade',
  
  // Abstract & Mystical
  'dream', 'wish', 'hope', 'seek', 'wander', 'roam', 'quest', 'journey',
  'vibe', 'echo', 'resonate', 'transcend', 'ascend', 'evolve', 'create', 'inspire'
];

export function generateNickname(seed: string): string {
  // Use the seed to consistently generate same index for same user
  const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const adjIndex = seedNum % adjectives.length;
  const nounIndex = (seedNum * 7) % nouns.length; // Use prime number to get different distribution
  const verbIndex = (seedNum * 13) % verbs.length;
  
  // Use the seed to determine which pattern to use
  const pattern = seedNum % 4;
  
  switch (pattern) {
    case 0:
      return `${adjectives[adjIndex]}${capitalize(nouns[nounIndex])}`;
    case 1:
      return `${verbs[verbIndex]}${capitalize(nouns[nounIndex])}`;
    case 2:
      return `${adjectives[adjIndex]}${capitalize(verbs[verbIndex])}`;
    case 3:
      return `${verbs[verbIndex]}${capitalize(adjectives[adjIndex])}`;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 