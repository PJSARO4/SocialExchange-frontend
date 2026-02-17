// AmbientAudioEngine - Multi-channel ambient audio with Web Audio synthesis
// Supports multiple ambient sound types/channels that users can switch between

type Scene = 'entrance' | 'cockpit' | 'dashboard' | 'feeds' | 'market' | 'default';

// Available ambient channel types
export type AmbientChannel =
  | 'deep-space'      // Original space ambience
  | 'cyber-pulse'     // Electronic pulsing
  | 'station-hum'     // Space station machinery
  | 'data-stream'     // Digital data flowing
  | 'nebula-drift'    // Ethereal cosmic winds
  | 'warp-core'       // Engine-like rumble
  | 'silence';        // No ambient

interface AudioConfig {
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

// Channel descriptions for UI
export const CHANNEL_INFO: Record<AmbientChannel, { name: string; description: string; icon: string }> = {
  'deep-space': { name: 'Deep Space', description: 'Vast cosmic ambience', icon: '🌌' },
  'cyber-pulse': { name: 'Cyber Pulse', description: 'Electronic rhythms', icon: '💠' },
  'station-hum': { name: 'Station Hum', description: 'Machinery & systems', icon: '🛸' },
  'data-stream': { name: 'Data Stream', description: 'Digital flow', icon: '📡' },
  'nebula-drift': { name: 'Nebula Drift', description: 'Ethereal winds', icon: '🌀' },
  'warp-core': { name: 'Warp Core', description: 'Deep engine rumble', icon: '⚛️' },
  'silence': { name: 'Silence', description: 'No ambient audio', icon: '🔇' },
};

// Web Audio synthesis parameters for each channel
interface SynthParams {
  baseFreq: number;
  harmonics: number[];
  noiseAmount: number;
  pulseRate: number;
  filterFreq: number;
  filterQ: number;
  lfoSpeed: number;
  lfoDepth: number;
}

const SYNTH_PARAMS: Record<Exclude<AmbientChannel, 'deep-space' | 'silence'>, SynthParams> = {
  'cyber-pulse': {
    baseFreq: 55,
    harmonics: [1, 2, 3, 5],
    noiseAmount: 0.15,
    pulseRate: 0.5,
    filterFreq: 800,
    filterQ: 2,
    lfoSpeed: 0.1,
    lfoDepth: 20,
  },
  'station-hum': {
    baseFreq: 60,
    harmonics: [1, 2, 4],
    noiseAmount: 0.3,
    pulseRate: 0.05,
    filterFreq: 400,
    filterQ: 1,
    lfoSpeed: 0.02,
    lfoDepth: 5,
  },
  'data-stream': {
    baseFreq: 110,
    harmonics: [1, 1.5, 2, 3],
    noiseAmount: 0.4,
    pulseRate: 2,
    filterFreq: 2000,
    filterQ: 5,
    lfoSpeed: 0.3,
    lfoDepth: 100,
  },
  'nebula-drift': {
    baseFreq: 40,
    harmonics: [1, 1.5, 2],
    noiseAmount: 0.5,
    pulseRate: 0.02,
    filterFreq: 600,
    filterQ: 0.7,
    lfoSpeed: 0.01,
    lfoDepth: 10,
  },
  'warp-core': {
    baseFreq: 35,
    harmonics: [1, 2, 3, 4, 5],
    noiseAmount: 0.2,
    pulseRate: 0.1,
    filterFreq: 200,
    filterQ: 3,
    lfoSpeed: 0.05,
    lfoDepth: 8,
  },
};

// Scene configs with volume levels per scene
const SCENE_CONFIGS: Record<Scene, AudioConfig> = {
  entrance: { src: '/audio/deep-space.mp3', volume: 0.45, fadeIn: 2000, fadeOut: 1000 },
  cockpit: { src: '/audio/deep-space.mp3', volume: 0.4, fadeIn: 1500, fadeOut: 1000 },
  dashboard: { src: '/audio/deep-space.mp3', volume: 0.35, fadeIn: 1500, fadeOut: 1000 },
  feeds: { src: '/audio/deep-space.mp3', volume: 0.3, fadeIn: 1000, fadeOut: 800 },
  market: { src: '/audio/deep-space.mp3', volume: 0.35, fadeIn: 1000, fadeOut: 800 },
  default: { src: '/audio/deep-space.mp3', volume: 0.35, fadeIn: 1500, fadeOut: 1000 },
};

class AmbientAudioEngine {
  private static instance: AmbientAudioEngine;

  // MP3 playback
  private audio: HTMLAudioElement | null = null;

  // Web Audio synthesis
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;

  // State
  private currentScene: Scene = 'default';
  private currentChannel: AmbientChannel = 'deep-space';
  private isPlaying: boolean = false;
  private targetVolume: number = 0.2;
  private fadeInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private usingSynth: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AmbientAudioEngine {
    if (!AmbientAudioEngine.instance) {
      AmbientAudioEngine.instance = new AmbientAudioEngine();
    }
    return AmbientAudioEngine.instance;
  }

  private initAudio(): void {
    if (this.initialized || typeof window === 'undefined') return;

    // Initialize MP3 player
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = 0;

    this.audio.addEventListener('error', (e) => {
      console.warn('[AmbientAudio] Audio error:', e);
    });

    this.audio.addEventListener('canplaythrough', () => {
      console.log('[AmbientAudio] Audio loaded and ready');
    });

    // Initialize Web Audio context (lazy - created when needed)
    this.initialized = true;
  }

  private initWebAudio(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.audioContext.destination);
      console.log('[AmbientAudio] Web Audio initialized');
    } catch (error) {
      console.warn('[AmbientAudio] Could not init Web Audio:', error);
    }
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Brown noise (smoother than white noise)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    return buffer;
  }

  private startSynthesis(channel: Exclude<AmbientChannel, 'deep-space' | 'silence'>): void {
    if (!this.audioContext || !this.masterGain) return;

    this.stopSynthesis();

    const params = SYNTH_PARAMS[channel];

    // Create filter
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = params.filterFreq;
    this.filter.Q.value = params.filterQ;
    this.filter.connect(this.masterGain);

    // Create LFO for modulation
    this.lfo = this.audioContext.createOscillator();
    this.lfo.frequency.value = params.lfoSpeed;
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = params.lfoDepth;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Create oscillators for harmonics
    this.oscillators = [];
    params.harmonics.forEach((harmonic, i) => {
      if (!this.audioContext || !this.filter) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.value = params.baseFreq * harmonic;
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';

      // Decrease volume for higher harmonics
      gain.gain.value = 0.15 / (i + 1);

      osc.connect(gain);
      gain.connect(this.filter);
      osc.start();

      this.oscillators.push(osc);
    });

    // Add noise
    if (params.noiseAmount > 0) {
      const noiseBuffer = this.createNoiseBuffer();
      if (noiseBuffer) {
        this.noiseSource = this.audioContext.createBufferSource();
        this.noiseSource.buffer = noiseBuffer;
        this.noiseSource.loop = true;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = params.noiseAmount * 0.1;

        this.noiseSource.connect(noiseGain);
        noiseGain.connect(this.filter);
        this.noiseSource.start();
      }
    }

    this.usingSynth = true;
    console.log(`[AmbientAudio] Synthesis started: ${channel}`);
  }

  private stopSynthesis(): void {
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch {}
    });
    this.oscillators = [];

    if (this.noiseSource) {
      try { this.noiseSource.stop(); this.noiseSource.disconnect(); } catch {}
      this.noiseSource = null;
    }

    if (this.lfo) {
      try { this.lfo.stop(); this.lfo.disconnect(); } catch {}
      this.lfo = null;
    }

    if (this.filter) {
      try { this.filter.disconnect(); } catch {}
      this.filter = null;
    }

    this.usingSynth = false;
  }

  async start(scene: Scene | string = 'default'): Promise<void> {
    if (typeof window === 'undefined') return;

    this.initAudio();

    const sceneKey = (scene as Scene) in SCENE_CONFIGS ? (scene as Scene) : 'default';
    const config = SCENE_CONFIGS[sceneKey];

    this.currentScene = sceneKey;
    this.targetVolume = config.volume;

    console.log(`[AmbientAudio] Starting scene: ${sceneKey}, channel: ${this.currentChannel}`);

    if (this.currentChannel === 'silence') {
      this.isPlaying = true;
      return;
    }

    try {
      if (this.currentChannel === 'deep-space') {
        // Use MP3 for deep-space
        if (!this.audio) return;

        if (!this.audio.src.endsWith(config.src)) {
          this.audio.src = config.src;
        }

        await this.audio.play();
        this.isPlaying = true;
        this.fadeToVolume(config.volume, config.fadeIn);
      } else {
        // Use Web Audio synthesis for other channels
        this.initWebAudio();

        if (this.audioContext?.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.startSynthesis(this.currentChannel as Exclude<AmbientChannel, 'deep-space' | 'silence'>);
        this.isPlaying = true;
        this.fadeToVolume(config.volume, config.fadeIn);
      }
    } catch (error) {
      console.warn('[AmbientAudio] Could not start audio:', error);
    }
  }

  private fadeToVolume(target: number, duration: number): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.usingSynth
      ? (this.masterGain?.gain.value ?? 0)
      : (this.audio?.volume ?? 0);

    const volumeDiff = target - startVolume;
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = volumeDiff / steps;
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, Math.min(1, startVolume + (volumeStep * currentStep)));

      if (this.usingSynth && this.masterGain) {
        this.masterGain.gain.value = newVolume;
      } else if (this.audio) {
        this.audio.volume = newVolume;
      }

      if (currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }
    }, stepDuration);
  }

  // Change ambient channel (sound type)
  async setChannel(channel: AmbientChannel): Promise<void> {
    if (channel === this.currentChannel) return;

    const wasPlaying = this.isPlaying;
    const config = SCENE_CONFIGS[this.currentScene];

    console.log(`[AmbientAudio] Switching channel: ${this.currentChannel} → ${channel}`);

    // Fade out current
    this.fadeToVolume(0, 500);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Stop current
    if (this.usingSynth) {
      this.stopSynthesis();
    } else if (this.audio) {
      this.audio.pause();
    }

    this.currentChannel = channel;

    // Start new channel if was playing
    if (wasPlaying && channel !== 'silence') {
      if (channel === 'deep-space') {
        if (!this.audio) return;
        this.audio.src = config.src;
        await this.audio.play();
        this.fadeToVolume(this.targetVolume, 500);
      } else {
        this.initWebAudio();
        if (this.audioContext?.state === 'suspended') {
          await this.audioContext.resume();
        }
        this.startSynthesis(channel as Exclude<AmbientChannel, 'deep-space' | 'silence'>);
        this.fadeToVolume(this.targetVolume, 500);
      }
    }
  }

  getChannel(): AmbientChannel {
    return this.currentChannel;
  }

  getAvailableChannels(): AmbientChannel[] {
    return Object.keys(CHANNEL_INFO) as AmbientChannel[];
  }

  changeScene(scene: Scene | string): void {
    if (!this.isPlaying) return;

    const sceneKey = (scene as Scene) in SCENE_CONFIGS ? (scene as Scene) : 'default';
    if (sceneKey === this.currentScene) return;

    const config = SCENE_CONFIGS[sceneKey];
    this.currentScene = sceneKey;
    this.targetVolume = config.volume;

    console.log(`[AmbientAudio] Changing to scene: ${sceneKey}`);

    this.fadeToVolume(config.volume, 1000);
  }

  playTransitionSound(): void {
    if (typeof window === 'undefined') return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      console.log('[AmbientAudio] Transition sound played');
    } catch (error) {
      console.warn('[AmbientAudio] Could not play transition sound:', error);
    }
  }

  pause(): void {
    if (!this.isPlaying) return;

    const config = SCENE_CONFIGS[this.currentScene];

    this.fadeToVolume(0, config.fadeOut);

    setTimeout(() => {
      if (this.usingSynth) {
        this.stopSynthesis();
      } else if (this.audio) {
        this.audio.pause();
      }
      this.isPlaying = false;
    }, config.fadeOut);

    console.log('[AmbientAudio] Pausing');
  }

  resume(): void {
    if (this.isPlaying) return;

    if (this.currentChannel === 'silence') {
      this.isPlaying = true;
      return;
    }

    if (this.currentChannel === 'deep-space') {
      this.audio?.play().then(() => {
        this.isPlaying = true;
        this.fadeToVolume(this.targetVolume, 1000);
        console.log('[AmbientAudio] Resumed');
      }).catch(err => {
        console.warn('[AmbientAudio] Could not resume:', err);
      });
    } else {
      this.initWebAudio();
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
      this.startSynthesis(this.currentChannel as Exclude<AmbientChannel, 'deep-space' | 'silence'>);
      this.isPlaying = true;
      this.fadeToVolume(this.targetVolume, 1000);
      console.log('[AmbientAudio] Resumed');
    }
  }

  stop(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.usingSynth) {
      this.stopSynthesis();
    }

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.volume = 0;
    }

    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }

    this.isPlaying = false;

    console.log('[AmbientAudio] Stopped');
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.targetVolume = clampedVolume;
    this.fadeToVolume(clampedVolume, 300);
  }

  getVolume(): number {
    if (this.usingSynth) {
      return this.masterGain?.gain.value ?? 0;
    }
    return this.audio?.volume ?? 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentScene(): Scene {
    return this.currentScene;
  }
}

export function getAmbientAudio(): AmbientAudioEngine {
  return AmbientAudioEngine.getInstance();
}

export default AmbientAudioEngine;
