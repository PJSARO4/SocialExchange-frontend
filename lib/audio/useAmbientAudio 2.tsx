"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface AmbientAudioContextType {
  isPlaying: boolean;
  volume: number;
  currentMood: string;
  play: () => void;
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
  play: () => {},
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

  const play = useCallback(() => {
    console.log('[AmbientAudio] Play');
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    console.log('[AmbientAudio] Pause');
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((v: number) => {
    console.log('[AmbientAudio] Set volume:', v);
    setVolumeState(v);
  }, []);

  const playTransition = useCallback(() => {
    console.log('[AmbientAudio] Play transition');
  }, []);

  const setMoodForPath = useCallback((mood: string) => {
    console.log('[AmbientAudio] Set mood for path:', mood);
    if (autoChangeMood) {
      setCurrentMood(mood);
    }
  }, [autoChangeMood]);

  const setMood = useCallback((mood: string) => {
    console.log('[AmbientAudio] Set mood:', mood);
    setCurrentMood(mood);
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
