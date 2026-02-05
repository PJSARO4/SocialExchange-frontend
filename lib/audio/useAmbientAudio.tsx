"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { getAmbientAudio } from './AmbientAudioEngine';

interface AmbientAudioContextType {
  isPlaying: boolean;
  volume: number;
  currentMood: string;
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  playTransition: () => void;
  setMoodForPath: (mood: string) => void;
  setMood: (mood: string) => void;
}

const defaultContext: AmbientAudioContextType = {
  isPlaying: false,
  volume: 0.5,
  currentMood: 'default',
  play: async () => {},
  pause: () => {},
  setVolume: () => {},
  playTransition: () => {},
  setMoodForPath: () => {},
  setMood: () => {},
};

const AmbientAudioContext = createContext<AmbientAudioContextType>(defaultContext);

interface AmbientAudioProviderProps {
  children: ReactNode;
  autoChangeMood?: boolean;
  defaultVolume?: number;
}

export function AmbientAudioProvider({
  children,
  autoChangeMood = false,
  defaultVolume = 0.5
}: AmbientAudioProviderProps) {
  const [volume, setVolumeState] = useState(defaultVolume);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMood, setCurrentMood] = useState('default');

  // Sync with audio engine on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = getAmbientAudio();
      setIsPlaying(audio.getIsPlaying());
    }
  }, []);

  const play = useCallback(async () => {
    try {
      const audio = getAmbientAudio();
      await audio.start(currentMood || 'cockpit');
      setIsPlaying(true);
      console.log('[AmbientAudio] Started playing');
    } catch (error) {
      console.warn('[AmbientAudio] Could not start:', error);
    }
  }, [currentMood]);

  const pause = useCallback(() => {
    const audio = getAmbientAudio();
    audio.pause();
    setIsPlaying(false);
    console.log('[AmbientAudio] Paused');
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = getAmbientAudio();
    audio.setVolume(v);
    setVolumeState(v);
    console.log('[AmbientAudio] Set volume:', v);
  }, []);

  const playTransition = useCallback(() => {
    const audio = getAmbientAudio();
    audio.playTransitionSound();
    console.log('[AmbientAudio] Play transition');
  }, []);

  const setMoodForPath = useCallback((mood: string) => {
    console.log('[AmbientAudio] Set mood for path:', mood);
    if (autoChangeMood) {
      setCurrentMood(mood);
      // Change scene in the audio engine
      const audio = getAmbientAudio();
      audio.changeScene(mood);
    }
  }, [autoChangeMood]);

  const setMood = useCallback((mood: string) => {
    console.log('[AmbientAudio] Set mood:', mood);
    setCurrentMood(mood);
    const audio = getAmbientAudio();
    audio.changeScene(mood);
  }, []);

  const value: AmbientAudioContextType = {
    isPlaying,
    volume,
    currentMood,
    play,
    pause,
    setVolume,
    playTransition,
    setMoodForPath,
    setMood,
  };

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
    </AmbientAudioContext.Provider>
  );
}

export function useAmbientAudio() {
  return useContext(AmbientAudioContext);
}

export default useAmbientAudio;
