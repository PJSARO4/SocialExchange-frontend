'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode
} from 'react';
import { usePathname } from 'next/navigation';
import { getAmbientAudio, type AmbientMood } from './AmbientAudioEngine';

// ============================================
// CONTEXT TYPE
// ============================================

interface AmbientAudioContextType {
  isPlaying: boolean;
  currentMood: AmbientMood;
  volume: number;
  isEnabled: boolean;
  start: (mood?: AmbientMood) => Promise<void>;
  stop: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  changeMood: (mood: AmbientMood) => void;
  setMoodForPath: (path: string) => void;
  playTransitionSound: () => void;
}

const AmbientAudioContext = createContext<AmbientAudioContextType | null>(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface AmbientAudioProviderProps {
  children: ReactNode;
  autoPlay?: boolean;
  autoChangeMood?: boolean;
  defaultVolume?: number;
}

export function AmbientAudioProvider({
  children,
  autoPlay = false,
  autoChangeMood = true,
  defaultVolume = 0.7
}: AmbientAudioProviderProps) {
  const pathname = usePathname();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMood, setCurrentMood] = useState<AmbientMood>('entrance');
  const [volume, setVolumeState] = useState(defaultVolume);
  const [isEnabled, setIsEnabled] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Initialize audio engine
  useEffect(() => {
    const audio = getAmbientAudio();

    // Load saved preferences
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('se-audio-volume');
      const savedEnabled = localStorage.getItem('se-audio-enabled');

      if (savedVolume) {
        const vol = parseFloat(savedVolume);
        setVolumeState(vol);
        audio.setVolume(vol);
      }

      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === 'true');
      }
    }

    return () => {
      // Don't dispose - keep audio running across page navigations
    };
  }, []);

  // Handle user interaction (required for audio autoplay policies)
  useEffect(() => {
    const handleInteraction = () => {
      setHasUserInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Auto-change mood based on pathname
  useEffect(() => {
    if (!autoChangeMood || !isPlaying) return;

    const audio = getAmbientAudio();
    audio.setMoodForPath(pathname);

    // Update local state
    const state = audio.getState();
    setCurrentMood(state.currentMood);
  }, [pathname, autoChangeMood, isPlaying]);

  // Actions
  const start = useCallback(async (mood?: AmbientMood) => {
    if (!isEnabled) return;

    const audio = getAmbientAudio();
    await audio.start(mood || currentMood);
    setIsPlaying(true);

    const state = audio.getState();
    setCurrentMood(state.currentMood);
  }, [isEnabled, currentMood]);

  const stop = useCallback(() => {
    const audio = getAmbientAudio();
    audio.stop();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);

    const audio = getAmbientAudio();
    audio.setVolume(clampedVol);

    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('se-audio-volume', clampedVol.toString());
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);

    if (typeof window !== 'undefined') {
      localStorage.setItem('se-audio-enabled', enabled.toString());
    }

    if (!enabled && isPlaying) {
      stop();
    }
  }, [isPlaying, stop]);

  const changeMood = useCallback((mood: AmbientMood) => {
    const audio = getAmbientAudio();
    audio.changeMood(mood);
    setCurrentMood(mood);
  }, []);

  const setMoodForPath = useCallback((path: string) => {
    const audio = getAmbientAudio();
    audio.setMoodForPath(path);
    const state = audio.getState();
    setCurrentMood(state.currentMood);
  }, []);

  const playTransitionSound = useCallback(() => {
    if (!isPlaying || !isEnabled) return;

    const audio = getAmbientAudio();
    audio.playTransitionSound();
  }, [isPlaying, isEnabled]);

  return (
    <AmbientAudioContext.Provider
      value={{
        isPlaying,
        currentMood,
        volume,
        isEnabled,
        start,
        stop,
        toggle,
        setVolume,
        setEnabled,
        changeMood,
        setMoodForPath,
        playTransitionSound
      }}
    >
      {children}
    </AmbientAudioContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAmbientAudio() {
  const context = useContext(AmbientAudioContext);

  if (!context) {
    // Return no-op functions if outside provider
    return {
      isPlaying: false,
      currentMood: 'entrance' as AmbientMood,
      volume: 0.7,
      isEnabled: false,
      start: async () => {},
      stop: () => {},
      toggle: () => {},
      setVolume: () => {},
      setEnabled: () => {},
      changeMood: () => {},
      setMoodForPath: () => {},
      playTransitionSound: () => {}
    };
  }

  return context;
}

export default AmbientAudioProvider;
