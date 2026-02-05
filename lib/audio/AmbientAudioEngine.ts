// AmbientAudioEngine - Actual audio playback implementation

type Scene = 'entrance' | 'cockpit' | 'dashboard' | 'feeds' | 'market' | 'default';

interface AudioConfig {
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

const SCENE_CONFIGS: Record<Scene, AudioConfig> = {
  entrance: { src: '/audio/deep-space.mp3', volume: 0.3, fadeIn: 2000, fadeOut: 1000 },
  cockpit: { src: '/audio/deep-space.mp3', volume: 0.25, fadeIn: 1500, fadeOut: 1000 },
  dashboard: { src: '/audio/deep-space.mp3', volume: 0.2, fadeIn: 1500, fadeOut: 1000 },
  feeds: { src: '/audio/deep-space.mp3', volume: 0.15, fadeIn: 1000, fadeOut: 800 },
  market: { src: '/audio/deep-space.mp3', volume: 0.2, fadeIn: 1000, fadeOut: 800 },
  default: { src: '/audio/deep-space.mp3', volume: 0.2, fadeIn: 1500, fadeOut: 1000 },
};

class AmbientAudioEngine {
  private static instance: AmbientAudioEngine;
  private audio: HTMLAudioElement | null = null;
  private currentScene: Scene = 'default';
  private isPlaying: boolean = false;
  private targetVolume: number = 0.2;
  private fadeInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

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

    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = 0;

    // Handle audio errors gracefully
    this.audio.addEventListener('error', (e) => {
      console.warn('[AmbientAudio] Audio error:', e);
    });

    // Handle successful load
    this.audio.addEventListener('canplaythrough', () => {
      console.log('[AmbientAudio] Audio loaded and ready');
    });

    this.initialized = true;
  }

  async start(scene: Scene | string = 'default'): Promise<void> {
    if (typeof window === 'undefined') return;

    this.initAudio();
    if (!this.audio) return;

    const sceneKey = (scene as Scene) in SCENE_CONFIGS ? (scene as Scene) : 'default';
    const config = SCENE_CONFIGS[sceneKey];

    this.currentScene = sceneKey;
    this.targetVolume = config.volume;

    console.log(`[AmbientAudio] Starting scene: ${sceneKey}`);

    try {
      // Set source if different
      if (!this.audio.src.endsWith(config.src)) {
        this.audio.src = config.src;
      }

      // Start playback
      await this.audio.play();
      this.isPlaying = true;

      // Fade in
      this.fadeToVolume(config.volume, config.fadeIn);
    } catch (error) {
      console.warn('[AmbientAudio] Could not start audio:', error);
      // This is expected if user hasn't interacted with the page yet
    }
  }

  private fadeToVolume(target: number, duration: number): void {
    if (!this.audio) return;

    // Clear any existing fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.audio.volume;
    const volumeDiff = target - startVolume;
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = volumeDiff / steps;
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;
      if (this.audio) {
        const newVolume = Math.max(0, Math.min(1, startVolume + (volumeStep * currentStep)));
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

  changeScene(scene: Scene | string): void {
    if (!this.audio || !this.isPlaying) return;

    const sceneKey = (scene as Scene) in SCENE_CONFIGS ? (scene as Scene) : 'default';
    if (sceneKey === this.currentScene) return;

    const config = SCENE_CONFIGS[sceneKey];
    this.currentScene = sceneKey;
    this.targetVolume = config.volume;

    console.log(`[AmbientAudio] Changing to scene: ${sceneKey}`);

    // Crossfade to new volume
    this.fadeToVolume(config.volume, 1000);
  }

  playTransitionSound(): void {
    if (typeof window === 'undefined') return;

    // Create a quick whoosh/transition sound effect
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
    if (!this.audio || !this.isPlaying) return;

    const config = SCENE_CONFIGS[this.currentScene];

    // Fade out then pause
    this.fadeToVolume(0, config.fadeOut);

    setTimeout(() => {
      if (this.audio) {
        this.audio.pause();
        this.isPlaying = false;
      }
    }, config.fadeOut);

    console.log('[AmbientAudio] Pausing');
  }

  resume(): void {
    if (!this.audio || this.isPlaying) return;

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.fadeToVolume(this.targetVolume, 1000);
      console.log('[AmbientAudio] Resumed');
    }).catch(err => {
      console.warn('[AmbientAudio] Could not resume:', err);
    });
  }

  stop(): void {
    if (!this.audio) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.volume = 0;
    this.isPlaying = false;

    console.log('[AmbientAudio] Stopped');
  }

  setVolume(volume: number): void {
    if (!this.audio) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.targetVolume = clampedVolume;
    this.fadeToVolume(clampedVolume, 300);
  }

  getVolume(): number {
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
