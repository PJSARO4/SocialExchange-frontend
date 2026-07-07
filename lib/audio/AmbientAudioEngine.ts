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

  // Web Audio synthesis (musical space-ambient pad engine)
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private tremolo: GainNode | null = null;
  private tremoloLfo: OscillatorNode | null = null;
  private secondaryOscillators: OscillatorNode[] = [];

  // Pad engine nodes
  private padOscillators: OscillatorNode[] = [];
  private padGains: GainNode[] = [];
  private padBus: GainNode | null = null;        // dry pad sum (pre-filter)
  private padFilter: BiquadFilterNode | null = null;
  private filterLfo: OscillatorNode | null = null;
  private filterLfoGain: GainNode | null = null;
  private swellGain: GainNode | null = null;      // slow amplitude swell
  private swellLfo: OscillatorNode | null = null;
  private swellLfoGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private bellTimer: ReturnType<typeof setTimeout> | null = null;
  private currentChordIndex: number = 0;
  private padRootFreq: number = 55;
  private padScaleName: 'major7' | 'minor7' = 'major7';

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
  // Default play order — lead with a generated musical pad so the ambient
  // bed on cockpit entry is the warm evolving space pad (not the MP3).
  private defaultOrder(): string[] {
    const ids = AMBIENT_TRACKS.map(t => t.id);
    const firstSynth = AMBIENT_TRACKS.find(t => t.type === 'synth');
    if (!firstSynth) return ids;
    return [firstSynth.id, ...ids.filter(id => id !== firstSynth.id)];
  }

  private loadPlaylist(): PlaylistState {
    if (typeof window === 'undefined') {
      return { shuffleEnabled: false, currentIndex: 0, order: this.defaultOrder() };
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
    return { shuffleEnabled: false, currentIndex: 0, order: this.defaultOrder() };
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

  // ---- REVERB (generated impulse response) ----
  private createReverbImpulse(seconds: number, decay: number): AudioBuffer | null {
    if (!this.audioContext) return null;
    const rate = this.audioContext.sampleRate;
    const length = Math.max(1, Math.floor(rate * seconds));
    const impulse = this.audioContext.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        // Smooth exponential-decay noise tail = lush, diffuse space reverb
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return impulse;
  }

  // ---- SYNTHESIS ENGINE (musical space-ambient pad) ----
  // We reinterpret each legacy "track" as a musical pad: its params seed a
  // root note, scale color, filter tone and motion so tracks stay distinct,
  // but every one is a warm, evolving cinematic pad rather than a drone/hum.

  private static readonly PENTATONIC = [0, 2, 4, 7, 9]; // semitone offsets

  // Fold an arbitrary base frequency into a pleasant low pad-root region.
  private padRootFromFreq(freq: number): number {
    let f = freq;
    while (f > 110) f /= 2;   // keep root low (~A1..A2)
    while (f < 41) f *= 2;
    return f;
  }

  private semitone(freq: number, semitones: number): number {
    return freq * Math.pow(2, semitones / 12);
  }

  private startSynthesis(params: SynthParams): void {
    if (!this.audioContext || !this.masterGain) return;

    this.stopSynthesis();
    const ctx = this.audioContext;

    // Derive musical character from legacy params
    this.padRootFreq = this.padRootFromFreq(params.baseFreq);
    // More harmonics / higher pulse -> brighter major color; sparse/slow -> warm minor
    this.padScaleName = (params.harmonics.length >= 5 || params.pulseRate >= 1) ? 'major7' : 'minor7';
    this.currentChordIndex = 0;

    // --- Signal chain: pad voices -> padBus -> lowpass -> [dry + reverb wet] -> swell -> master ---
    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.7;
    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = 0.6; // generous reverb = spacious

    this.swellGain = ctx.createGain();
    this.swellGain.gain.value = 0.85;
    this.swellGain.connect(this.masterGain);
    this.dryGain.connect(this.swellGain);
    this.wetGain.connect(this.swellGain);

    // Reverb (generated impulse response)
    this.reverbNode = ctx.createConvolver();
    const impulse = this.createReverbImpulse(6.0, 3.0);
    if (impulse) this.reverbNode.buffer = impulse;
    this.reverbNode.connect(this.wetGain);

    // Gentle lowpass on the whole pad, softly modulated by a slow LFO
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    const baseCutoff = Math.min(2600, Math.max(500, params.filterFreq * 0.9 + 400));
    this.padFilter.frequency.value = baseCutoff;
    this.padFilter.Q.value = 0.6;
    this.padFilter.connect(this.dryGain);
    this.padFilter.connect(this.reverbNode);

    this.filterLfo = ctx.createOscillator();
    this.filterLfo.type = 'sine';
    this.filterLfo.frequency.value = 0.04 + (params.lfoSpeed || 0.03) * 0.3; // very slow
    this.filterLfoGain = ctx.createGain();
    this.filterLfoGain.gain.value = Math.min(700, baseCutoff * 0.35); // sweep depth
    this.filterLfo.connect(this.filterLfoGain);
    this.filterLfoGain.connect(this.padFilter.frequency);
    this.filterLfo.start();

    // padBus = summing node for the currently-sounding chord voices
    this.padBus = ctx.createGain();
    this.padBus.gain.value = 1.0;
    this.padBus.connect(this.padFilter);

    // Very slow amplitude swell (breathing) across the whole bed
    this.swellLfo = ctx.createOscillator();
    this.swellLfo.type = 'sine';
    this.swellLfo.frequency.value = 0.045; // ~22s breathing cycle
    this.swellLfoGain = ctx.createGain();
    this.swellLfoGain.gain.value = 0.12;
    this.swellLfo.connect(this.swellLfoGain);
    this.swellLfoGain.connect(this.swellGain.gain);
    this.swellLfo.start();

    // Build the first chord and schedule slow evolution + sparse bells
    this.voiceChord(this.currentChordIndex, 4.0);
    this.scheduleChordEvolution();
    this.scheduleBell();

    this.usingSynth = true;
  }

  // Chord degrees (scale-tone offsets in semitones) that gently evolve over time.
  private static readonly CHORD_PROGRESSION = [0, -5, 3, -2, 5, 0, -7, 2];

  // Voice a soft pad chord = root + fifth + octave + a color 7th tone, each
  // rendered by 2 slightly-detuned oscillators through soft attack envelopes.
  private voiceChord(progressionIndex: number, fadeIn: number): void {
    if (!this.audioContext || !this.padBus) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Fade & retire any currently-sounding voices
    const oldOscs = this.padOscillators;
    const oldGains = this.padGains;
    oldGains.forEach(g => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0.0001, now + Math.max(2, fadeIn));
      } catch {}
    });
    oldOscs.forEach(osc => {
      try { osc.stop(now + Math.max(2, fadeIn) + 0.5); } catch {}
    });

    this.padOscillators = [];
    this.padGains = [];

    const rootShift = AmbientAudioEngine.CHORD_PROGRESSION[
      progressionIndex % AmbientAudioEngine.CHORD_PROGRESSION.length
    ];
    const chordRoot = this.semitone(this.padRootFreq, rootShift);
    const seventh = this.padScaleName === 'major7' ? 11 : 10;

    // Intervals: root, octave, fifth (up an octave), major/minor-7th color
    const voices: { semis: number; level: number; wave: OscillatorType }[] = [
      { semis: 0,       level: 0.16, wave: 'sine' },
      { semis: 12,      level: 0.11, wave: 'sine' },
      { semis: 7 + 12,  level: 0.09, wave: 'triangle' },
      { semis: seventh + 12, level: 0.06, wave: 'sine' },
    ];

    voices.forEach(v => {
      const freq = this.semitone(chordRoot, v.semis);
      // 2 slightly-detuned oscillators per voice for a warm, wide pad
      [-1, 1].forEach(dir => {
        const osc = ctx.createOscillator();
        osc.type = v.wave;
        osc.frequency.value = freq;
        osc.detune.value = dir * (5 + Math.random() * 4); // gentle chorus
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(v.level / 2, now + Math.max(2, fadeIn));
        osc.connect(g);
        g.connect(this.padBus!);
        osc.start(now);
        this.padOscillators.push(osc);
        this.padGains.push(g);
      });
    });
  }

  private scheduleChordEvolution(): void {
    if (this.chordTimer) clearTimeout(this.chordTimer);
    const next = 20000 + Math.random() * 20000; // change chord/color every 20-40s
    this.chordTimer = setTimeout(() => {
      if (!this.usingSynth) return;
      this.currentChordIndex++;
      this.voiceChord(this.currentChordIndex, 8.0); // long crossfade
      this.scheduleChordEvolution();
    }, next);
  }

  // Sparse, soft bell/pad notes from a pentatonic set at long random intervals.
  private scheduleBell(): void {
    if (this.bellTimer) clearTimeout(this.bellTimer);
    const next = 12000 + Math.random() * 22000; // 12-34s apart
    this.bellTimer = setTimeout(() => {
      if (!this.usingSynth) return;
      this.playBell();
      this.scheduleBell();
    }, next);
  }

  private playBell(): void {
    if (!this.audioContext || !this.padFilter) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const rootShift = AmbientAudioEngine.CHORD_PROGRESSION[
      this.currentChordIndex % AmbientAudioEngine.CHORD_PROGRESSION.length
    ];
    const chordRoot = this.semitone(this.padRootFreq, rootShift);
    const pent = AmbientAudioEngine.PENTATONIC;
    const degree = pent[Math.floor(Math.random() * pent.length)];
    const octave = 24 + (Math.random() < 0.5 ? 12 : 0); // 2-3 octaves up = airy
    const freq = this.semitone(chordRoot, degree + octave);

    // Soft sine "bell": quick-ish attack, long gentle release, routed through reverb
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const peak = 0.05;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);
    osc.connect(g);
    if (this.dryGain) g.connect(this.dryGain);
    if (this.reverbNode) g.connect(this.reverbNode);
    osc.start(now);
    osc.stop(now + 6.5);
  }

  private stopSynthesis(): void {
    if (this.chordTimer) { clearTimeout(this.chordTimer); this.chordTimer = null; }
    if (this.bellTimer) { clearTimeout(this.bellTimer); this.bellTimer = null; }

    this.padOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch {}
    });
    this.padOscillators = [];
    this.padGains.forEach(g => { try { g.disconnect(); } catch {} });
    this.padGains = [];

    const disc = (n: AudioNode | null) => { if (n) { try { n.disconnect(); } catch {} } };
    const stopOsc = (o: OscillatorNode | null) => { if (o) { try { o.stop(); o.disconnect(); } catch {} } };

    stopOsc(this.filterLfo); this.filterLfo = null;
    disc(this.filterLfoGain); this.filterLfoGain = null;
    stopOsc(this.swellLfo); this.swellLfo = null;
    disc(this.swellLfoGain); this.swellLfoGain = null;
    disc(this.padBus); this.padBus = null;
    disc(this.padFilter); this.padFilter = null;
    disc(this.reverbNode); this.reverbNode = null;
    disc(this.wetGain); this.wetGain = null;
    disc(this.dryGain); this.dryGain = null;
    disc(this.swellGain); this.swellGain = null;

    // Legacy fields (kept for safety; unused by new engine)
    this.oscillators.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch {} });
    this.oscillators = [];
    this.secondaryOscillators.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch {} });
    this.secondaryOscillators = [];
    if (this.noiseSource) { try { this.noiseSource.stop(); this.noiseSource.disconnect(); } catch {} this.noiseSource = null; }
    stopOsc(this.lfo); this.lfo = null;
    stopOsc(this.tremoloLfo); this.tremoloLfo = null;
    disc(this.tremolo); this.tremolo = null;
    disc(this.filter); this.filter = null;

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

  // Soft, pleasant riser/whoosh (filtered-noise swell) — no beep.
  playTransitionSound(): void {
    if (typeof window === 'undefined') return;

    try {
      // Reuse the shared context if available so we don't leak AudioContexts.
      const ctx = this.audioContext
        ?? new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const dur = 1.4;

      // Gentle filtered white-noise whoosh
      const noiseLen = Math.floor(ctx.sampleRate * dur);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * 0.5;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(300, now);
      bp.frequency.exponentialRampToValueAtTime(2400, now + dur * 0.8); // rising sweep

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.linearRampToValueAtTime(0.06, now + dur * 0.5);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      // Warm sine sub-swell underneath for body
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(220, now + dur * 0.8);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.05, now + dur * 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      noise.connect(bp); bp.connect(nGain); nGain.connect(ctx.destination);
      sub.connect(subGain); subGain.connect(ctx.destination);

      noise.start(now); noise.stop(now + dur);
      sub.start(now); sub.stop(now + dur);
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
