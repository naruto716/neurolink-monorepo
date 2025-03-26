import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setIsSpeaking } from './accessibilitySlice';

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export const useTextToSpeech = (options: TextToSpeechOptions = {}) => {
  const dispatch = useDispatch();
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  
  // Initialize speech synthesis on first use
  const initSpeechSynthesis = useCallback(() => {
    if (!speechSynthRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
      dispatch(setIsSpeaking(false));
      removeHighlight();
      return true;
    }
    return false;
  }, [dispatch, removeHighlight]);

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
      dispatch(setIsSpeaking(true));
      if (element) {
        highlightElement(element);
      }
    };
    
    utterance.onend = () => {
      dispatch(setIsSpeaking(false));
      removeHighlight();
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      dispatch(setIsSpeaking(false));
      removeHighlight();
    };
    
    // Save reference and speak
    utteranceRef.current = utterance;
    speechSynthRef.current!.speak(utterance);
    
    return true;
  }, [initSpeechSynthesis, options, highlightElement, removeHighlight, stop, dispatch]);

  return {
    speak,
    stop,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window
  };
}; 