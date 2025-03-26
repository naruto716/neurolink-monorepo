import { useCallback, useRef, useState } from 'react';

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export const useTextToSpeech = (options: TextToSpeechOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  
  // Initialize speech synthesis on first use
  const initSpeechSynthesis = useCallback(() => {
    if (!speechSynthRef.current && 'speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
    return !!speechSynthRef.current;
  }, []);

  // Apply highlight to element
  const highlightElement = useCallback((element: HTMLElement) => {
    if (highlightedElementRef.current) {
      // Remove previous highlight
      highlightedElementRef.current.style.backgroundColor = '';
    }
    
    // Apply new highlight
    highlightedElementRef.current = element;
    element.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
  }, []);

  // Remove highlight
  const removeHighlight = useCallback(() => {
    if (highlightedElementRef.current) {
      highlightedElementRef.current.style.backgroundColor = '';
      highlightedElementRef.current = null;
    }
  }, []);
  
  // Stop speech - Define this BEFORE speak to avoid circular dependency
  const stop = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      removeHighlight();
      return true;
    }
    return false;
  }, [removeHighlight]);

  // Speak text
  const speak = useCallback((text: string, element?: HTMLElement) => {
    if (!initSpeechSynthesis()) return false;
    
    // Stop any current speech
    stop();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';
    
    // Add event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      if (element) {
        highlightElement(element);
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      removeHighlight();
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
      removeHighlight();
    };
    
    // Save reference and speak
    utteranceRef.current = utterance;
    speechSynthRef.current!.speak(utterance);
    
    return true;
  }, [initSpeechSynthesis, options, highlightElement, removeHighlight, stop]);

  // Pause speech
  const pause = useCallback(() => {
    if (speechSynthRef.current && isSpeaking) {
      speechSynthRef.current.pause();
      setIsPaused(true);
      return true;
    }
    return false;
  }, [isSpeaking]);

  // Resume speech
  const resume = useCallback(() => {
    if (speechSynthRef.current && isPaused) {
      speechSynthRef.current.resume();
      setIsPaused(false);
      return true;
    }
    return false;
  }, [isPaused]);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported: 'speechSynthesis' in window
  };
}; 