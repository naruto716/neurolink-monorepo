import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { useTextToSpeech } from './useTextToSpeech';

interface AccessibilityContextType {
  screenReaderEnabled: boolean;
  toggleScreenReader: () => void;
  speak: (text: string, element?: HTMLElement) => boolean;
  stop: () => boolean;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  screenReaderEnabled: false,
  toggleScreenReader: () => {},
  speak: () => false,
  stop: () => false,
  isSpeaking: false,
});

// Local storage key for screen reader preference
const SCREEN_READER_STORAGE_KEY = 'neurolink-screen-reader-enabled';

export const AccessibilityProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Initialize from local storage
  const getInitialScreenReaderState = (): boolean => {
    const savedPreference = localStorage.getItem(SCREEN_READER_STORAGE_KEY);
    return savedPreference === 'true';
  };

  const [screenReaderEnabled, setScreenReaderEnabled] = useState<boolean>(getInitialScreenReaderState);
  
  // Get text-to-speech functionality
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech({
    rate: 0.9, // Slightly slower for better comprehension
    pitch: 1,
    volume: 1,
  });

  // Toggle screen reader
  const toggleScreenReader = () => {
    setScreenReaderEnabled((prev) => !prev);
  };

  // Save preference to local storage
  useEffect(() => {
    localStorage.setItem(SCREEN_READER_STORAGE_KEY, screenReaderEnabled.toString());
  }, [screenReaderEnabled]);

  // Show warning if speech synthesis is not supported
  useEffect(() => {
    if (screenReaderEnabled && !isSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      // You might want to show a toast or other notification to the user
    }
  }, [screenReaderEnabled, isSupported]);

  return (
    <AccessibilityContext.Provider
      value={{
        screenReaderEnabled,
        toggleScreenReader,
        speak,
        stop,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use the accessibility context
export const useAccessibility = () => useContext(AccessibilityContext); 