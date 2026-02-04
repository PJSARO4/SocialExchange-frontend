/**
 * SOCIAL EXCHANGE - Ambient Audio Engine
 *
 * Creates immersive, sci-fi themed ambient soundscapes using Web Audio API.
 * Multiple tracks/moods that change based on context.
 * No external audio files required - all sounds are synthesized.
 */

// ============================================
// TYPES
// ============================================

export type AmbientMood =
  | 'entrance'      // Main landing page - mysterious, inviting
  | 'command'       // Dashboard/command center - focused, professional
  | 'market'        // Trading/market - dynamic, subtle tension
  | 'feeds'         // E-Feeds management - calm, productive
  | 'comms'         // Communications - quiet, ambient
  | 'cruise'        // Idle/cruise mode - peaceful, spacious
  | 'transition'    // Page transitions - brief energetic burst
  | 'exploration'   // Discovering new content - curious, wonder
  | 'alert'         // Notifications, warnings - attention-grabbing
  | 'peaceful'      // Meditation/focus mode - serene, minimal
  | 'deepspace'     // Deep ambient - vast, cosmic, lonely
  | 'nebula'        // Ethereal, colorful, dreamy
  | 'hyperspace'    // Fast movement, excitement, energy
  | 'station'       // Space station hum - industrial, mechanical
  | 'pulse'         // High energy rhythmic - 120 BPM feel
  | 'cyberspace'    // Fast digital - glitchy, intense
  | 'warpcore'      // Powerful engine hum - driving energy
  | 'battlestation' // Action/urgent - high intensity
  | 'datastream'    // Fast flowing data - rapid, electric
  | 'redzone'       // Maximum threat - heart-pounding
  | 'darkcore'      // Dark, ominous, menacing
  | 'pursuit'       // Chase sequence - relentless pressure
  | 'dread'         // Horror suspense - creeping terror
  | 'incoming';     // Imminent impact - building tension

interface MoodConfig {
  baseFrequency: number;
  harmonics: number[];
  noiseAmount: number;
  pulseRate: number;
  shimmerIntensity: number;
  filterFreq: number;
  modSpeed: number;
  character: 'warm' | 'cool' | 'neutral' | 'tense';
}

// ============================================
// MOOD CONFIGURATIONS
// ============================================

const MOOD_CONFIGS: Record<AmbientMood, MoodConfig> = {
  entrance: {
    baseFrequency: 55,        // A1 - deep, mysterious
    harmonics: [1, 1.5, 2, 3],
    noiseAmount: 0.03,
    pulseRate: 0,             // No pulse - open, inviting
    shimmerIntensity: 0.8,
    filterFreq: 600,
    modSpeed: 0.05,
    character: 'warm'
  },
  command: {
    baseFrequency: 65.4,      // C2 - authoritative
    harmonics: [1, 2, 3, 4],
    noiseAmount: 0.02,
    pulseRate: 0.25,          // Subtle pulse - alert but calm
    shimmerIntensity: 0.4,
    filterFreq: 800,
    modSpeed: 0.08,
    character: 'neutral'
  },
  market: {
    baseFrequency: 73.4,      // D2 - energetic tension
    harmonics: [1, 1.33, 2, 2.67],
    noiseAmount: 0.04,
    pulseRate: 0.4,           // More active pulse
    shimmerIntensity: 0.6,
    filterFreq: 1000,
    modSpeed: 0.12,
    character: 'tense'
  },
  feeds: {
    baseFrequency: 82.4,      // E2 - productive, flowing
    harmonics: [1, 2, 3, 5],
    noiseAmount: 0.025,
    pulseRate: 0.15,
    shimmerIntensity: 0.5,
    filterFreq: 700,
    modSpeed: 0.06,
    character: 'warm'
  },
  comms: {
    baseFrequency: 49,        // G1 - intimate, quiet
    harmonics: [1, 2, 4],
    noiseAmount: 0.015,
    pulseRate: 0,
    shimmerIntensity: 0.3,
    filterFreq: 500,
    modSpeed: 0.04,
    character: 'cool'
  },
  cruise: {
    baseFrequency: 41.2,      // E1 - vast, spacious
    harmonics: [1, 1.5, 2, 3, 4],
    noiseAmount: 0.035,
    pulseRate: 0.08,          // Very slow breathing
    shimmerIntensity: 1.0,
    filterFreq: 400,
    modSpeed: 0.03,
    character: 'cool'
  },
  transition: {
    baseFrequency: 110,       // A2 - energetic burst
    harmonics: [1, 2, 3],
    noiseAmount: 0.05,
    pulseRate: 0.8,
    shimmerIntensity: 0.2,
    filterFreq: 1200,
    modSpeed: 0.2,
    character: 'neutral'
  },
  exploration: {
    baseFrequency: 62,        // B1 - curious, ascending feel
    harmonics: [1, 1.25, 1.5, 2, 2.5, 3],
    noiseAmount: 0.025,
    pulseRate: 0.2,
    shimmerIntensity: 0.9,
    filterFreq: 900,
    modSpeed: 0.07,
    character: 'warm'
  },
  alert: {
    baseFrequency: 98,        // G2 - attention-grabbing
    harmonics: [1, 2, 3, 4, 5],
    noiseAmount: 0.06,
    pulseRate: 0.6,
    shimmerIntensity: 0.3,
    filterFreq: 1400,
    modSpeed: 0.15,
    character: 'tense'
  },
  peaceful: {
    baseFrequency: 36.7,      // D1 - deep, serene
    harmonics: [1, 2, 3],
    noiseAmount: 0.01,
    pulseRate: 0,
    shimmerIntensity: 0.6,
    filterFreq: 350,
    modSpeed: 0.02,
    character: 'warm'
  },
  deepspace: {
    baseFrequency: 27.5,      // A0 - extremely deep, cosmic
    harmonics: [1, 1.5, 2, 3, 5, 8],
    noiseAmount: 0.04,
    pulseRate: 0.05,
    shimmerIntensity: 1.2,
    filterFreq: 250,
    modSpeed: 0.015,
    character: 'cool'
  },
  nebula: {
    baseFrequency: 52,        // G#1 - ethereal, dreamy
    harmonics: [1, 1.33, 1.67, 2, 2.5, 3, 4],
    noiseAmount: 0.035,
    pulseRate: 0.1,
    shimmerIntensity: 1.5,
    filterFreq: 700,
    modSpeed: 0.04,
    character: 'warm'
  },
  hyperspace: {
    baseFrequency: 130.8,     // C3 - energetic, fast
    harmonics: [1, 2, 3, 4],
    noiseAmount: 0.07,
    pulseRate: 0.9,
    shimmerIntensity: 0.4,
    filterFreq: 1800,
    modSpeed: 0.25,
    character: 'neutral'
  },
  station: {
    baseFrequency: 45,        // F#1 - industrial hum
    harmonics: [1, 2, 3, 4, 6, 8],
    noiseAmount: 0.05,
    pulseRate: 0.35,
    shimmerIntensity: 0.2,
    filterFreq: 600,
    modSpeed: 0.1,
    character: 'cool'
  },
  pulse: {
    baseFrequency: 55,        // A1 - driving bass
    harmonics: [1, 2, 4, 8],
    noiseAmount: 0.04,
    pulseRate: 1.0,           // ~120 BPM feel
    shimmerIntensity: 0.5,
    filterFreq: 1200,
    modSpeed: 0.2,
    character: 'tense'
  },
  cyberspace: {
    baseFrequency: 82.4,      // E2 - digital, glitchy
    harmonics: [1, 1.5, 2, 3, 4, 6],
    noiseAmount: 0.08,
    pulseRate: 1.2,           // ~140 BPM feel
    shimmerIntensity: 0.7,
    filterFreq: 2000,
    modSpeed: 0.35,
    character: 'tense'
  },
  warpcore: {
    baseFrequency: 36.7,      // D1 - deep powerful engine
    harmonics: [1, 2, 3, 4, 5, 6],
    noiseAmount: 0.06,
    pulseRate: 0.85,          // ~100 BPM driving
    shimmerIntensity: 0.3,
    filterFreq: 800,
    modSpeed: 0.18,
    character: 'warm'
  },
  battlestation: {
    baseFrequency: 98,        // G2 - urgent, intense
    harmonics: [1, 2, 3, 4, 5],
    noiseAmount: 0.09,
    pulseRate: 1.4,           // ~160 BPM action
    shimmerIntensity: 0.4,
    filterFreq: 1600,
    modSpeed: 0.4,
    character: 'tense'
  },
  datastream: {
    baseFrequency: 110,       // A2 - rapid, electric
    harmonics: [1, 2, 3, 5, 7],
    noiseAmount: 0.07,
    pulseRate: 1.1,           // ~130 BPM flowing
    shimmerIntensity: 0.9,
    filterFreq: 2200,
    modSpeed: 0.3,
    character: 'cool'
  },
  redzone: {
    baseFrequency: 41.2,      // E1 - deep threat
    harmonics: [1, 2, 3, 4, 5, 6, 7, 8],
    noiseAmount: 0.12,
    pulseRate: 1.8,           // ~180 BPM heart-pounding
    shimmerIntensity: 0.2,
    filterFreq: 1800,
    modSpeed: 0.5,
    character: 'tense'
  },
  darkcore: {
    baseFrequency: 32.7,      // C1 - very deep, ominous
    harmonics: [1, 1.5, 2, 2.5, 3, 4, 5],
    noiseAmount: 0.08,
    pulseRate: 0.7,           // Slow menacing pulse
    shimmerIntensity: 0.15,
    filterFreq: 400,
    modSpeed: 0.08,
    character: 'tense'
  },
  pursuit: {
    baseFrequency: 73.4,      // D2 - driving chase
    harmonics: [1, 2, 3, 4, 6],
    noiseAmount: 0.1,
    pulseRate: 1.5,           // ~150 BPM relentless
    shimmerIntensity: 0.35,
    filterFreq: 1400,
    modSpeed: 0.45,
    character: 'tense'
  },
  dread: {
    baseFrequency: 29.1,      // Bb0 - subsonic dread
    harmonics: [1, 1.2, 1.5, 2, 3, 5],
    noiseAmount: 0.06,
    pulseRate: 0.4,           // Slow creeping pulse
    shimmerIntensity: 0.5,
    filterFreq: 300,
    modSpeed: 0.05,
    character: 'tense'
  },
  incoming: {
    baseFrequency: 55,        // A1 - building tension
    harmonics: [1, 2, 3, 4, 5, 6, 7],
    noiseAmount: 0.09,
    pulseRate: 1.3,           // Accelerating feel
    shimmerIntensity: 0.6,
    filterFreq: 1600,
    modSpeed: 0.35,
    character: 'tense'
  }
};

// Character color tones (subtle tonal coloring)
const CHARACTER_COLORS = {
  warm: { low: 1.0, mid: 0.9, high: 0.7 },
  cool: { low: 0.8, mid: 1.0, high: 1.1 },
  neutral: { low: 0.9, mid: 1.0, high: 0.9 },
  tense: { low: 1.1, mid: 0.85, high: 0.95 }
};

// Related moods for variation - when in one mood, can drift to related moods
const MOOD_VARIATIONS: Partial<Record<AmbientMood, AmbientMood[]>> = {
  entrance: ['exploration', 'nebula', 'peaceful'],
  command: ['station', 'alert', 'feeds', 'warpcore'],
  market: ['alert', 'hyperspace', 'station', 'pulse'],
  feeds: ['peaceful', 'exploration', 'command'],
  comms: ['peaceful', 'deepspace', 'station'],
  cruise: ['deepspace', 'nebula', 'peaceful'],
  exploration: ['nebula', 'entrance', 'deepspace', 'datastream'],
  peaceful: ['deepspace', 'nebula', 'cruise'],
  deepspace: ['nebula', 'peaceful', 'cruise', 'dread'],
  nebula: ['deepspace', 'exploration', 'peaceful'],
  hyperspace: ['alert', 'market', 'station', 'cyberspace', 'battlestation'],
  station: ['command', 'market', 'comms', 'warpcore'],
  pulse: ['cyberspace', 'hyperspace', 'market', 'datastream', 'pursuit'],
  cyberspace: ['pulse', 'battlestation', 'datastream', 'hyperspace', 'redzone'],
  warpcore: ['station', 'pulse', 'command', 'battlestation', 'incoming'],
  battlestation: ['cyberspace', 'alert', 'warpcore', 'pulse', 'redzone', 'pursuit'],
  datastream: ['cyberspace', 'pulse', 'exploration', 'hyperspace'],
  redzone: ['battlestation', 'pursuit', 'incoming', 'cyberspace'],
  darkcore: ['dread', 'deepspace', 'incoming', 'warpcore'],
  pursuit: ['redzone', 'battlestation', 'cyberspace', 'pulse'],
  dread: ['darkcore', 'deepspace', 'incoming', 'peaceful'],
  incoming: ['redzone', 'battlestation', 'darkcore', 'pursuit'],
};

// ============================================
// AMBIENT AUDIO ENGINE CLASS
// ============================================

class AmbientAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentMood: AmbientMood = 'entrance';
  private targetMood: AmbientMood | null = null;

  // Audio nodes
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private filterNodes: BiquadFilterNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;
  private lfoNodes: OscillatorNode[] = [];

  // Scheduling
  private pulseTimeout: NodeJS.Timeout | null = null;
  private shimmerTimeouts: NodeJS.Timeout[] = [];
  private crossfadeTimeout: NodeJS.Timeout | null = null;

  // Configuration
  private readonly FADE_DURATION = 2500;
  private readonly CROSSFADE_DURATION = 4000;
  private readonly MAX_VOLUME = 0.12;
  private userVolume: number = 1.0;

  // Auto-variation
  private autoVariationEnabled: boolean = true;
  private variationTimeout: NodeJS.Timeout | null = null;
  private baseMood: AmbientMood = 'entrance'; // The mood set by the page/user

  /**
   * Initialize the audio context
   */
  async init(): Promise<boolean> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.audioContext.destination);

      return true;
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
      return false;
    }
  }

  /**
   * Start ambient audio with specified mood
   */
  async start(mood: AmbientMood = 'entrance'): Promise<void> {
    if (!this.audioContext) {
      const success = await this.init();
      if (!success) return;
    }

    if (!this.audioContext || !this.masterGain) return;

    this.currentMood = mood;
    this.baseMood = mood;
    this.isPlaying = true;

    this.buildSoundscape(mood);
    this.fadeIn();

    // Start auto-variation if enabled
    if (this.autoVariationEnabled) {
      this.scheduleVariation();
    }
  }

  /**
   * Stop ambient audio
   */
  stop(): void {
    if (!this.isPlaying) return;

    this.clearVariationTimeout();
    this.fadeOut(() => {
      this.cleanup();
      this.isPlaying = false;
    });
  }

  /**
   * Change mood with crossfade
   */
  async changeMood(newMood: AmbientMood): Promise<void> {
    if (!this.isPlaying) {
      await this.start(newMood);
      return;
    }

    if (newMood === this.currentMood) return;

    this.targetMood = newMood;

    // Crossfade to new mood
    this.crossfade(newMood);
  }

  /**
   * Set mood based on page path
   */
  setMoodForPath(path: string): void {
    let mood: AmbientMood = 'command';

    if (path === '/' || path.includes('entrance')) {
      mood = 'entrance';
    } else if (path.includes('dashboard')) {
      mood = 'command';
    } else if (path.includes('market') || path.includes('trading')) {
      mood = 'market';
    } else if (path.includes('feeds') || path.includes('my-feeds')) {
      mood = 'feeds';
    } else if (path.includes('comms')) {
      mood = 'comms';
    } else if (path.includes('cruise') || path.includes('idle')) {
      mood = 'cruise';
    } else if (path.includes('analytics')) {
      mood = 'exploration';
    } else if (path.includes('settings')) {
      mood = 'station';
    }

    // Update base mood and current mood
    this.baseMood = mood;
    this.changeMood(mood);

    // Restart variation schedule with new base
    if (this.autoVariationEnabled && this.isPlaying) {
      this.scheduleVariation();
    }
  }

  /**
   * Play brief transition sound
   */
  playTransitionSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Quick sweep sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08 * this.userVolume, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Toggle playback
   */
  toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start(this.currentMood);
    }
  }

  /**
   * Set user volume (0-1)
   */
  setVolume(volume: number): void {
    this.userVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioContext) {
      const targetVolume = this.MAX_VOLUME * this.userVolume;
      this.masterGain.gain.setTargetAtTime(
        targetVolume,
        this.audioContext.currentTime,
        0.1
      );
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentMood: this.currentMood,
      baseMood: this.baseMood,
      volume: this.userVolume,
      autoVariationEnabled: this.autoVariationEnabled
    };
  }

  /**
   * Enable/disable auto mood variation
   */
  setAutoVariation(enabled: boolean): void {
    this.autoVariationEnabled = enabled;
    if (enabled && this.isPlaying) {
      this.scheduleVariation();
    } else if (!enabled) {
      this.clearVariationTimeout();
      // Return to base mood if currently varied
      if (this.currentMood !== this.baseMood) {
        this.changeMood(this.baseMood);
      }
    }
  }

  /**
   * Schedule a random mood variation
   */
  private scheduleVariation(): void {
    if (!this.autoVariationEnabled || !this.isPlaying) return;

    this.clearVariationTimeout();

    // Wait 45-120 seconds before varying
    const delay = 45000 + Math.random() * 75000;

    this.variationTimeout = setTimeout(() => {
      if (!this.isPlaying || !this.autoVariationEnabled) return;

      const variations = MOOD_VARIATIONS[this.baseMood];
      if (variations && variations.length > 0 && Math.random() > 0.3) {
        // 70% chance to vary when timer fires
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        console.log(`[AmbientAudio] Varying from ${this.currentMood} to ${randomVariation}`);
        this.changeMood(randomVariation);

        // Schedule return to base mood after 30-60 seconds
        setTimeout(() => {
          if (this.isPlaying && this.autoVariationEnabled) {
            console.log(`[AmbientAudio] Returning to base mood: ${this.baseMood}`);
            this.changeMood(this.baseMood);
            this.scheduleVariation();
          }
        }, 30000 + Math.random() * 30000);
      } else {
        // Didn't vary, schedule next check
        this.scheduleVariation();
      }
    }, delay);
  }

  private clearVariationTimeout(): void {
    if (this.variationTimeout) {
      clearTimeout(this.variationTimeout);
      this.variationTimeout = null;
    }
  }

  // ============================================
  // SOUNDSCAPE BUILDING
  // ============================================

  private buildSoundscape(mood: AmbientMood): void {
    const config = MOOD_CONFIGS[mood];
    const color = CHARACTER_COLORS[config.character];

    this.createDroneLayer(config, color);
    this.createPadLayer(config, color);
    this.createNoiseLayer(config);

    if (config.pulseRate > 0) {
      this.createPulseLayer(config);
    }

    if (config.shimmerIntensity > 0) {
      this.createShimmerLayer(config);
    }
  }

  /**
   * Main drone layer
   */
  private createDroneLayer(config: MoodConfig, color: typeof CHARACTER_COLORS.warm): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = config.baseFrequency;

    filter.type = 'lowpass';
    filter.frequency.value = config.filterFreq * 0.5;
    filter.Q.value = 0.7;

    gain.gain.value = 0.35 * color.low;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Pitch modulation
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = config.modSpeed;
    lfoGain.gain.value = config.baseFrequency * 0.02;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.start();
    lfo.start();

    this.oscillators.push(osc);
    this.lfoNodes.push(lfo);
    this.gainNodes.push(gain);
    this.filterNodes.push(filter);
  }

  /**
   * Harmonic pad layer
   */
  private createPadLayer(config: MoodConfig, color: typeof CHARACTER_COLORS.warm): void {
    if (!this.audioContext || !this.masterGain) return;

    config.harmonics.forEach((harmonic, index) => {
      const freq = config.baseFrequency * harmonic;
      const isLow = freq < 200;
      const isMid = freq >= 200 && freq < 600;

      let colorMult = color.high;
      if (isLow) colorMult = color.low;
      else if (isMid) colorMult = color.mid;

      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();

      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 15;

      filter.type = 'lowpass';
      filter.frequency.value = config.filterFreq;
      filter.Q.value = 0.5;

      const baseGain = 0.08 / Math.pow(index + 1, 0.7);
      gain.gain.value = baseGain * colorMult;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      // Individual LFO
      const lfo = this.audioContext!.createOscillator();
      const lfoGain = this.audioContext!.createGain();

      lfo.type = 'sine';
      lfo.frequency.value = config.modSpeed * (0.8 + Math.random() * 0.4);
      lfoGain.gain.value = baseGain * 0.3;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.start();
      lfo.start();

      this.oscillators.push(osc);
      this.lfoNodes.push(lfo);
      this.gainNodes.push(gain);
      this.filterNodes.push(filter);
    });
  }

  /**
   * Filtered noise layer
   */
  private createNoiseLayer(config: MoodConfig): void {
    if (!this.audioContext || !this.masterGain || config.noiseAmount <= 0) return;

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = config.filterFreq * 0.6;
    filter.Q.value = 0.8;

    const gain = this.audioContext.createGain();
    gain.gain.value = config.noiseAmount;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();

    this.noiseNode = noise;
    this.gainNodes.push(gain);
    this.filterNodes.push(filter);

    // Filter modulation
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = config.modSpeed * 0.5;
    lfoGain.gain.value = config.filterFreq * 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    lfo.start();
    this.lfoNodes.push(lfo);
  }

  /**
   * Rhythmic pulse layer
   */
  private createPulseLayer(config: MoodConfig): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = config.baseFrequency * 1.5;

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    gain.gain.value = 0;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();

    this.oscillators.push(osc);
    this.gainNodes.push(gain);
    this.filterNodes.push(filter);

    const schedulePulse = () => {
      if (!this.isPlaying || !this.audioContext) return;

      const now = this.audioContext.currentTime;
      const pulseGain = 0.1 * config.pulseRate;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(pulseGain, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      gain.gain.setValueAtTime(0, now + 0.61);

      // Double beat for some moods
      if (config.pulseRate > 0.3) {
        gain.gain.setValueAtTime(0, now + 0.7);
        gain.gain.linearRampToValueAtTime(pulseGain * 0.6, now + 0.78);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        gain.gain.setValueAtTime(0, now + 1.21);
      }

      const interval = 4000 / config.pulseRate + Math.random() * 1000;
      this.pulseTimeout = setTimeout(schedulePulse, interval);
    };

    this.pulseTimeout = setTimeout(schedulePulse, 2000);
  }

  /**
   * High frequency shimmer
   */
  private createShimmerLayer(config: MoodConfig): void {
    if (!this.audioContext || !this.masterGain) return;

    const shimmerFreqs = [
      config.baseFrequency * 8,
      config.baseFrequency * 10,
      config.baseFrequency * 12
    ];

    shimmerFreqs.forEach((freq) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 30;

      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();

      this.oscillators.push(osc);
      this.gainNodes.push(gain);

      this.scheduleShimmer(gain, config.shimmerIntensity, freq);
    });
  }

  private scheduleShimmer(gain: GainNode, intensity: number, freq: number): void {
    const doShimmer = () => {
      if (!this.isPlaying || !this.audioContext) return;

      const now = this.audioContext.currentTime;
      const duration = 1.5 + Math.random() * 3;
      const delay = 2 + Math.random() * 6;
      const maxGain = 0.012 * intensity * (500 / freq);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(maxGain, now + delay + duration * 0.3);
      gain.gain.linearRampToValueAtTime(0, now + delay + duration);

      const timeout = setTimeout(doShimmer, (delay + duration + Math.random() * 2) * 1000);
      this.shimmerTimeouts.push(timeout);
    };

    const timeout = setTimeout(doShimmer, Math.random() * 3000);
    this.shimmerTimeouts.push(timeout);
  }

  // ============================================
  // TRANSITIONS
  // ============================================

  private fadeIn(): void {
    if (!this.masterGain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(
      this.MAX_VOLUME * this.userVolume,
      now + this.FADE_DURATION / 1000
    );
  }

  private fadeOut(callback?: () => void): void {
    if (!this.masterGain || !this.audioContext) {
      callback?.();
      return;
    }

    const now = this.audioContext.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + this.FADE_DURATION / 1000);

    setTimeout(() => callback?.(), this.FADE_DURATION);
  }

  private crossfade(newMood: AmbientMood): void {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const halfDuration = this.CROSSFADE_DURATION / 2000;

    // Fade out current
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + halfDuration);

    // After fade out, rebuild and fade in
    this.crossfadeTimeout = setTimeout(() => {
      this.cleanup(false);
      this.currentMood = newMood;
      this.buildSoundscape(newMood);

      if (this.masterGain && this.audioContext) {
        const fadeInTime = this.audioContext.currentTime;
        this.masterGain.gain.setValueAtTime(0, fadeInTime);
        this.masterGain.gain.linearRampToValueAtTime(
          this.MAX_VOLUME * this.userVolume,
          fadeInTime + halfDuration
        );
      }

      this.targetMood = null;
    }, this.CROSSFADE_DURATION / 2);
  }

  // ============================================
  // CLEANUP
  // ============================================

  private cleanup(includeMaster: boolean = true): void {
    // Clear timeouts
    if (this.pulseTimeout) {
      clearTimeout(this.pulseTimeout);
      this.pulseTimeout = null;
    }

    this.shimmerTimeouts.forEach(t => clearTimeout(t));
    this.shimmerTimeouts = [];

    if (this.crossfadeTimeout) {
      clearTimeout(this.crossfadeTimeout);
      this.crossfadeTimeout = null;
    }

    // Stop oscillators
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.oscillators = [];

    // Stop LFOs
    this.lfoNodes.forEach(lfo => {
      try {
        lfo.stop();
        lfo.disconnect();
      } catch (e) {}
    });
    this.lfoNodes = [];

    // Stop noise
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }

    // Disconnect gains
    this.gainNodes.forEach(gain => {
      try { gain.disconnect(); } catch (e) {}
    });
    this.gainNodes = [];

    // Disconnect filters
    this.filterNodes.forEach(filter => {
      try { filter.disconnect(); } catch (e) {}
    });
    this.filterNodes = [];
  }

  dispose(): void {
    this.stop();

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================
// SINGLETON & EXPORTS
// ============================================

let audioEngineInstance: AmbientAudioEngine | null = null;

export function getAmbientAudio(): AmbientAudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AmbientAudioEngine();
  }
  return audioEngineInstance;
}

export default AmbientAudioEngine;
