// AmbientAudioEngine v2 - Multi-track ambient audio with playlist, shuffle, and Web Audio synthesis
// 15 procedurally-generated ambient tracks + deep-space.mp3 + playlist management

type Scene = 'entrance' | 'cockpit' | 'dashboard' | 'feeds' | 'market' | 'default';

// ---- TRACK DEFINITIONS ----
export interface AmbientTrack {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'synth' | 'mp3';
  src?: string; // only for mp3 tracks
  synth?: SynthParams; // only for synth tracks
}

interface SynthParams {
  baseFreq: number;
  harmonics: number[];
  noiseAmount: number;
  pulseRate: number;
  filterFreq: number;
  filterQ: number;
  lfoSpeed: number;
  lfoDepth: number;
  waveforms?: OscillatorType[];
  // Extended params for richer variety
  secondaryFreq?: number;
  reverbMix?: number;
  tremoloSpeed?: number;
  tremoloDepth?: number;
  detuneRange?: number;
}

// 15 unique ambient tracks + deep-space mp3
export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Vast cosmic ambience',
    icon: 'galaxy',
    type: 'mp3',
    src: '/audio/deep-space.mp3',
  },
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse',
    description: 'Electronic rhythmic pulses',
    icon: 'cpu',
    type: 'synth',
    synth: {
      baseFreq: 55,
      harmonics: [1, 2, 3, 5],
      noiseAmount: 0.15,
      pulseRate: 0.5,
      filterFreq: 800,
      filterQ: 2,
      lfoSpeed: 0.1,
      lfoDepth: 20,
    },
  },
  {
    id: 'station-hum',
    name: 'Station Hum',
    description: 'Space station machinery',
    icon: 'rocket',
    type: 'synth',
    synth: {
      baseFreq: 60,
      harmonics: [1, 2, 4],
      noiseAmount: 0.3,
      pulseRate: 0.05,
      filterFreq: 400,
      filterQ: 1,
      lfoSpeed: 0.02,
      lfoDepth: 5,
    },
  },
  {
    id: 'data-stream',
    name: 'Data Stream',
    description: 'Digital flow & cascading bits',
    icon: 'radio',
    type: 'synth',
    synth: {
      baseFreq: 110,
      harmonics: [1, 1.5, 2, 3],
      noiseAmount: 0.4,
      pulseRate: 2,
      filterFreq: 2000,
      filterQ: 5,
      lfoSpeed: 0.3,
      lfoDepth: 100,
    },
  },
  {
    id: 'nebula-drift',
    name: 'Nebula Drift',
    description: 'Ethereal cosmic winds',
    icon: 'wind',
    type: 'synth',
    synth: {
      baseFreq: 40,
      harmonics: [1, 1.5, 2],
      noiseAmount: 0.5,
      pulseRate: 0.02,
      filterFreq: 600,
      filterQ: 0.7,
      lfoSpeed: 0.01,
      lfoDepth: 10,
    },
  },
  {
    id: 'warp-core',
    name: 'Warp Core',
    description: 'Deep engine rumble',
    icon: 'atom',
    type: 'synth',
    synth: {
      baseFreq: 35,
      harmonics: [1, 2, 3, 4, 5],
      noiseAmount: 0.2,
      pulseRate: 0.1,
      filterFreq: 200,
      filterQ: 3,
      lfoSpeed: 0.05,
      lfoDepth: 8,
    },
  },
  {
    id: 'aurora-waves',
    name: 'Aurora Waves',
    description: 'Shimmering northern lights',
    icon: 'waves',
    type: 'synth',
    synth: {
      baseFreq: 82,
      harmonics: [1, 1.25, 1.5, 2, 3],
      noiseAmount: 0.25,
      pulseRate: 0.08,
      filterFreq: 1200,
      filterQ: 1.5,
      lfoSpeed: 0.04,
      lfoDepth: 40,
      waveforms: ['sine', 'sine', 'triangle', 'sine', 'sine'],
      detuneRange: 8,
    },
  },
  {
    id: 'crystal-cavern',
    name: 'Crystal Cavern',
    description: 'Echoing mineral resonance',
    icon: 'gem',
    type: 'synth',
    synth: {
      baseFreq: 220,
      harmonics: [1, 2.01, 3.02, 5.03],
      noiseAmount: 0.1,
      pulseRate: 0.15,
      filterFreq: 3000,
      filterQ: 8,
      lfoSpeed: 0.06,
      lfoDepth: 150,
      waveforms: ['sine', 'sine', 'sine', 'sine'],
      detuneRange: 3,
    },
  },
  {
    id: 'solar-wind',
    name: 'Solar Wind',
    description: 'Radiant plasma streams',
    icon: 'sun',
    type: 'synth',
    synth: {
      baseFreq: 65,
      harmonics: [1, 1.5, 2, 2.5, 3, 4],
      noiseAmount: 0.55,
      pulseRate: 0.03,
      filterFreq: 900,
      filterQ: 0.5,
      lfoSpeed: 0.008,
      lfoDepth: 15,
      waveforms: ['triangle', 'sine', 'triangle', 'sine', 'sine', 'triangle'],
    },
  },
  {
    id: 'quantum-field',
    name: 'Quantum Field',
    description: 'Subatomic particle haze',
    icon: 'zap',
    type: 'synth',
    synth: {
      baseFreq: 150,
      harmonics: [1, 1.414, 2, 2.828, 4],
      noiseAmount: 0.35,
      pulseRate: 3,
      filterFreq: 2500,
      filterQ: 4,
      lfoSpeed: 0.5,
      lfoDepth: 200,
      waveforms: ['square', 'sine', 'square', 'sine', 'sine'],
      tremoloSpeed: 0.15,
      tremoloDepth: 0.3,
    },
  },
  {
    id: 'midnight-tide',
    name: 'Midnight Tide',
    description: 'Dark ocean currents',
    icon: 'moon',
    type: 'synth',
    synth: {
      baseFreq: 45,
      harmonics: [1, 1.5, 2],
      noiseAmount: 0.6,
      pulseRate: 0.015,
      filterFreq: 350,
      filterQ: 0.6,
      lfoSpeed: 0.007,
      lfoDepth: 8,
      waveforms: ['sine', 'triangle', 'sine'],
    },
  },
  {
    id: 'neon-district',
    name: 'Neon District',
    description: 'Cyberpunk city ambience',
    icon: 'building',
    type: 'synth',
    synth: {
      baseFreq: 73,
      harmonics: [1, 2, 3, 4, 6, 8],
      noiseAmount: 0.2,
      pulseRate: 1.5,
      filterFreq: 1500,
      filterQ: 6,
      lfoSpeed: 0.2,
      lfoDepth: 80,
      waveforms: ['sawtooth', 'sine', 'square', 'sine', 'sawtooth', 'sine'],
      secondaryFreq: 36.5,
      detuneRange: 12,
    },
  },
  {
    id: 'frozen-orbit',
    name: 'Frozen Orbit',
    description: 'Ice crystals in zero gravity',
    icon: 'snowflake',
    type: 'synth',
    synth: {
      baseFreq: 330,
      harmonics: [1, 2, 4],
      noiseAmount: 0.15,
      pulseRate: 0.04,
      filterFreq: 4000,
      filterQ: 10,
      lfoSpeed: 0.015,
      lfoDepth: 300,
      waveforms: ['sine', 'sine', 'sine'],
      detuneRange: 2,
      tremoloSpeed: 0.08,
      tremoloDepth: 0.2,
    },
  },
  {
    id: 'black-hole',
    name: 'Black Hole',
    description: 'Gravitational bass distortion',
    icon: 'circle',
    type: 'synth',
    synth: {
      baseFreq: 25,
      harmonics: [1, 2, 3, 4, 5, 6, 7],
      noiseAmount: 0.4,
      pulseRate: 0.07,
      filterFreq: 150,
      filterQ: 4,
      lfoSpeed: 0.03,
      lfoDepth: 6,
      waveforms: ['sine', 'sine', 'triangle', 'sine', 'sine', 'triangle', 'sine'],
    },
  },
  {
    id: 'signal-ghost',
    name: 'Signal Ghost',
    description: 'Lost transmissions in the void',
    icon: 'signal',
    type: 'synth',
    synth: {
      baseFreq: 196,
      harmonics: [1, 1.333, 1.667, 2],
      noiseAmount: 0.45,
      pulseRate: 0.25,
      filterFreq: 1800,
      filterQ: 3,
      lfoSpeed: 0.12,
      lfoDepth: 60,
      waveforms: ['sine', 'triangle', 'sine', 'triangle'],
      tremoloSpeed: 0.3,
      tremoloDepth: 0.5,
      detuneRange: 15,
    },
  },
  {
    id: 'terraform',
    name: 'Terraform',
    description: 'Planetary atmosphere generation',
    icon: 'globe',
    type: 'synth',
    synth: {
      baseFreq: 52,
      harmonics: [1, 1.5, 2, 3, 4],
      noiseAmount: 0.5,
      pulseRate: 0.025,
      filterFreq: 700,
      filterQ: 1,
      lfoSpeed: 0.005,
      lfoDepth: 12,
      waveforms: ['sine', 'triangle', 'sine', 'triangle', 'sine'],
      secondaryFreq: 26,
    },
  },
];

// Scene configs with volume levels per scene
interface AudioConfig {
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

const SCENE_CONFIGS: Record<Scene, AudioConfig> = {
  entrance: { volume: 0.45, fadeIn: 2000, fadeOut: 1000 },
  cockpit:  { volume: 0.4,  fadeIn: 1500, fadeOut: 1000 },
  dashboard:{ volume: 0.35, fadeIn: 1500, fadeOut: 1000 },
  feeds:    { volume: 0.3,  fadeIn: 1000, fadeOut: 800 },
  market:   { volume: 0.35, fadeIn: 1000, fadeOut: 800 },
  default:  { volume: 0.35, fadeIn: 1500, fadeOut: 1000 },
};

// Playlist state persisted in localStorage
const PLAYLIST_STORAGE_KEY = 'se-audio-playlist';

interface PlaylistState {
  shuffleEnabled: boolean;
  currentIndex: number;
  order: string[]; // track IDs in play order
}

// ---- EVENT SYSTEM ----
type AudioEventType = 'trackChange' | 'shuffleChange' | 'playStateChange';
type AudioEventListener = (data: any) => void;

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
  private tremolo: GainNode | null = null;
  private tremoloLfo: OscillatorNode | null = null;
  private secondaryOscillators: OscillatorNode[] = [];

  // State
  private currentScene: Scene = 'default';
  private isPlaying: boolean = false;
  private targetVolume: number = 0.2;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private initialized: boolean = false;
  private usingSynth: boolean = false;

  // Playlist
  private playlist: PlaylistState;
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private synthDuration: number = 45000; // Each synth "track" plays for 45s then advances

  // Events
  private listeners: Map<AudioEventType, Set<AudioEventListener>> = new Map();

  private constructor() {
    this.playlist = this.loadPlaylist();
  }

  static getInstance(): AmbientAudioEngine {
    if (!AmbientAudioEngine.instance) {
      AmbientAudioEngine.instance = new AmbientAudioEngine();
    }
    return AmbientAudioEngine.instance;
  }

  // ---- EVENT SYSTEM ----
  on(event: AudioEventType, listener: AudioEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: AudioEventType, listener: AudioEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: AudioEventType, data?: any): void {
    this.listeners.get(event)?.forEach(fn => {
      try { fn(data); } catch (e) { console.warn('[AmbientAudio] Event listener error:', e); }
    });
  }

  // ---- PLAYLIST MANAGEMENT ----
  private loadPlaylist(): PlaylistState {
    if (typeof window === 'undefined') {
      return { shuffleEnabled: false, currentIndex: 0, order: AMBIENT_TRACKS.map(t => t.id) };
    }
    try {
      const stored = localStorage.getItem(PLAYLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate order has all tracks
        if (parsed.order && parsed.order.length === AMBIENT_TRACKS.length) {
          return parsed;
        }
      }
    } catch {}
    return { shuffleEnabled: false, currentIndex: 0, order: AMBIENT_TRACKS.map(t => t.id) };
  }

  private savePlaylist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(this.playlist));
    } catch {}
  }

  private shuffleArray(arr: string[]): string[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getShuffleEnabled(): boolean {
    return this.playlist.shuffleEnabled;
  }

  toggleShuffle(): boolean {
    this.playlist.shuffleEnabled = !this.playlist.shuffleEnabled;
    if (this.playlist.shuffleEnabled) {
      // Shuffle the order, keeping current track at index 0
      const currentId = this.playlist.order[this.playlist.currentIndex];
      const others = AMBIENT_TRACKS.map(t => t.id).filter(id => id !== currentId);
      this.playlist.order = [currentId, ...this.shuffleArray(others)];
      this.playlist.currentIndex = 0;
    } else {
      // Restore default order, find current track
      const currentId = this.playlist.order[this.playlist.currentIndex];
      this.playlist.order = AMBIENT_TRACKS.map(t => t.id);
      this.playlist.currentIndex = this.playlist.order.indexOf(currentId);
    }
    this.savePlaylist();
    this.emit('shuffleChange', this.playlist.shuffleEnabled);
    return this.playlist.shuffleEnabled;
  }

  getCurrentTrack(): AmbientTrack {
    const trackId = this.playlist.order[this.playlist.currentIndex];
    return AMBIENT_TRACKS.find(t => t.id === trackId) || AMBIENT_TRACKS[0];
  }

  getCurrentTrackIndex(): number {
    return this.playlist.currentIndex;
  }

  getTrackCount(): number {
    return AMBIENT_TRACKS.length;
  }

  getAllTracks(): AmbientTrack[] {
    return AMBIENT_TRACKS;
  }

  async nextTrack(): Promise<void> {
    this.playlist.currentIndex = (this.playlist.currentIndex + 1) % this.playlist.order.length;
    this.savePlaylist();
    if (this.isPlaying) {
      await this.switchToCurrentTrack();
    }
    this.emit('trackChange', this.getCurrentTrack());
  }

  async prevTrack(): Promise<void> {
    this.playlist.currentIndex = this.playlist.currentIndex === 0
      ? this.playlist.order.length - 1
      : this.playlist.currentIndex - 1;
    this.savePlaylist();
    if (this.isPlaying) {
      await this.switchToCurrentTrack();
    }
    this.emit('trackChange', this.getCurrentTrack());
  }

  async playTrack(trackId: string): Promise<void> {
    const idx = this.playlist.order.indexOf(trackId);
    if (idx === -1) return;
    this.playlist.currentIndex = idx;
    this.savePlaylist();
    if (this.isPlaying) {
      await this.switchToCurrentTrack();
    } else {
      await this.start(this.currentScene);
    }
    this.emit('trackChange', this.getCurrentTrack());
  }

  private async switchToCurrentTrack(): Promise<void> {
    const track = this.getCurrentTrack();
    const config = SCENE_CONFIGS[this.currentScene];

    // Clear auto-advance timer
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }

    // Fade out current
    this.fadeToVolume(0, 500);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Stop current audio
    if (this.usingSynth) {
      this.stopSynthesis();
    } else if (this.audio) {
      this.audio.pause();
    }

    // Start new track
    if (track.type === 'mp3' && track.src) {
      if (!this.audio) return;
      this.audio.src = track.src;
      this.usingSynth = false;
      await this.audio.play();
      this.fadeToVolume(this.targetVolume, 500);
    } else if (track.type === 'synth' && track.synth) {
      this.initWebAudio();
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.startSynthesis(track.synth);
      this.fadeToVolume(this.targetVolume, 500);
      this.scheduleAutoAdvance();
    }
  }

  private scheduleAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
    }
    this.autoAdvanceTimer = setTimeout(() => {
      this.nextTrack();
    }, this.synthDuration);
  }

  // ---- AUDIO INITIALIZATION ----
  private initAudio(): void {
    if (this.initialized || typeof window === 'undefined') return;

    this.audio = new Audio();
    this.audio.loop = false; // No looping - advance to next track
    this.audio.preload = 'auto';
    this.audio.volume = 0;

    this.audio.addEventListener('error', (e) => {
      console.warn('[AmbientAudio] Audio error:', e);
    });

    // Auto-advance when MP3 ends
    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });

    this.initialized = true;
  }

  private initWebAudio(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('[AmbientAudio] Could not init Web Audio:', error);
    }
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Brown noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    return buffer;
  }

  // ---- SYNTHESIS ENGINE ----
  private startSynthesis(params: SynthParams): void {
    if (!this.audioContext || !this.masterGain) return;

    this.stopSynthesis();

    // Create filter
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = params.filterFreq;
    this.filter.Q.value = params.filterQ;

    // Tremolo (amplitude modulation) if specified
    if (params.tremoloSpeed && params.tremoloDepth) {
      this.tremolo = this.audioContext.createGain();
      this.tremolo.gain.value = 1.0;
      this.filter.connect(this.tremolo);
      this.tremolo.connect(this.masterGain);

      this.tremoloLfo = this.audioContext.createOscillator();
      this.tremoloLfo.frequency.value = params.tremoloSpeed;
      const tremoloGain = this.audioContext.createGain();
      tremoloGain.gain.value = params.tremoloDepth;
      this.tremoloLfo.connect(tremoloGain);
      tremoloGain.connect(this.tremolo.gain);
      this.tremoloLfo.start();
    } else {
      this.filter.connect(this.masterGain);
    }

    // Create LFO for filter modulation
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

      // Use specified waveform or default pattern
      if (params.waveforms && params.waveforms[i]) {
        osc.type = params.waveforms[i];
      } else {
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      }

      // Apply detune for richer sound
      if (params.detuneRange) {
        osc.detune.value = (Math.random() * 2 - 1) * params.detuneRange;
      }

      // Decrease volume for higher harmonics
      gain.gain.value = 0.15 / (i + 1);

      osc.connect(gain);
      gain.connect(this.filter);
      osc.start();

      this.oscillators.push(osc);
    });

    // Secondary oscillator for bass layer
    if (params.secondaryFreq) {
      const secOsc = this.audioContext.createOscillator();
      const secGain = this.audioContext.createGain();
      secOsc.frequency.value = params.secondaryFreq;
      secOsc.type = 'sine';
      secGain.gain.value = 0.08;
      secOsc.connect(secGain);
      secGain.connect(this.filter);
      secOsc.start();
      this.secondaryOscillators.push(secOsc);
    }

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
  }

  private stopSynthesis(): void {
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch {}
    });
    this.oscillators = [];

    this.secondaryOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch {}
    });
    this.secondaryOscillators = [];

    if (this.noiseSource) {
      try { this.noiseSource.stop(); this.noiseSource.disconnect(); } catch {}
      this.noiseSource = null;
    }

    if (this.lfo) {
      try { this.lfo.stop(); this.lfo.disconnect(); } catch {}
      this.lfo = null;
    }

    if (this.tremoloLfo) {
      try { this.tremoloLfo.stop(); this.tremoloLfo.disconnect(); } catch {}
      this.tremoloLfo = null;
    }

    if (this.tremolo) {
      try { this.tremolo.disconnect(); } catch {}
      this.tremolo = null;
    }

    if (this.filter) {
      try { this.filter.disconnect(); } catch {}
      this.filter = null;
    }

    this.usingSynth = false;
  }

  // ---- PLAYBACK CONTROLS ----
  async start(scene: Scene | string = 'default'): Promise<void> {
    if (typeof window === 'undefined') return;

    this.initAudio();

    const sceneKey = (scene as Scene) in SCENE_CONFIGS ? (scene as Scene) : 'default';
    const config = SCENE_CONFIGS[sceneKey];

    this.currentScene = sceneKey;
    this.targetVolume = config.volume;

    const track = this.getCurrentTrack();

    try {
      if (track.type === 'mp3' && track.src) {
        if (!this.audio) return;
        if (!this.audio.src.endsWith(track.src)) {
          this.audio.src = track.src;
        }
        this.usingSynth = false;
        await this.audio.play();
        this.isPlaying = true;
        this.fadeToVolume(config.volume, config.fadeIn);
      } else if (track.type === 'synth' && track.synth) {
        this.initWebAudio();
        if (this.audioContext?.state === 'suspended') {
          await this.audioContext.resume();
        }
        this.startSynthesis(track.synth);
        this.isPlaying = true;
        this.fadeToVolume(config.volume, config.fadeIn);
        this.scheduleAutoAdvance();
      }
    } catch (error) {
      console.warn('[AmbientAudio] Could not start audio:', error);
    }

    this.emit('playStateChange', true);
    this.emit('trackChange', track);
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

  changeScene(scene: Scene | string): void {
    if (!this.isPlaying) return;

    const sceneKey = (scene as Scene) in SCENE_CONFIGS ? (scene as Scene) : 'default';
    if (sceneKey === this.currentScene) return;

    const config = SCENE_CONFIGS[sceneKey];
    this.currentScene = sceneKey;
    this.targetVolume = config.volume;

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
    } catch (error) {
      console.warn('[AmbientAudio] Could not play transition sound:', error);
    }
  }

  pause(): void {
    if (!this.isPlaying) return;

    const config = SCENE_CONFIGS[this.currentScene];

    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }

    this.fadeToVolume(0, config.fadeOut);

    setTimeout(() => {
      if (this.usingSynth) {
        this.stopSynthesis();
      } else if (this.audio) {
        this.audio.pause();
      }
      this.isPlaying = false;
      this.emit('playStateChange', false);
    }, config.fadeOut);
  }

  resume(): void {
    if (this.isPlaying) return;

    const track = this.getCurrentTrack();

    if (track.type === 'mp3' && track.src) {
      // Check if audio element has a src set, otherwise fall back to start()
      if (!this.audio || !this.audio.src) {
        this.start(this.currentScene);
        return;
      }
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.fadeToVolume(this.targetVolume, 1000);
        this.emit('playStateChange', true);
      }).catch(err => {
        console.warn('[AmbientAudio] Could not resume:', err);
        // Fall back to start() if play() fails
        this.start(this.currentScene);
      });
    } else if (track.type === 'synth' && track.synth) {
      this.initWebAudio();
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
      this.startSynthesis(track.synth);
      this.isPlaying = true;
      this.fadeToVolume(this.targetVolume, 1000);
      this.scheduleAutoAdvance();
      this.emit('playStateChange', true);
    } else {
      // Fallback: if track type is unknown or missing, call start()
      this.start(this.currentScene);
    }
  }

  stop(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
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
    this.emit('playStateChange', false);
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

  // Legacy compatibility - getChannel returns current track id
  getChannel(): string {
    return this.getCurrentTrack().id;
  }

  getAvailableChannels(): string[] {
    return AMBIENT_TRACKS.map(t => t.id);
  }

  // Legacy compatibility - setChannel maps to playTrack
  async setChannel(channel: string): Promise<void> {
    await this.playTrack(channel);
  }
}

// Legacy export for backward compatibility
export type AmbientChannel = string;
export const CHANNEL_INFO: Record<string, { name: string; description: string; icon: string }> =
  Object.fromEntries(AMBIENT_TRACKS.map(t => [t.id, { name: t.name, description: t.description, icon: t.icon }]));

export function getAmbientAudio(): AmbientAudioEngine {
  return AmbientAudioEngine.getInstance();
}

export default AmbientAudioEngine;
