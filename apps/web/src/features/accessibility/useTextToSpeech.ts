import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setIsSpeaking } from './accessibilitySlice';

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

// Define an extended CSSStyleDeclaration that includes webkit properties
interface ExtendedCSSStyleDeclaration extends CSSStyleDeclaration {
  webkitBackgroundClip: string;
  webkitTextFillColor: string;
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
      // Remove previous highlight styling
      highlightedElementRef.current.style.background = '';
      highlightedElementRef.current.style.backgroundSize = '';
      highlightedElementRef.current.style.backgroundClip = '';
      (highlightedElementRef.current.style as ExtendedCSSStyleDeclaration).webkitBackgroundClip = '';
      highlightedElementRef.current.style.color = '';
      (highlightedElementRef.current.style as ExtendedCSSStyleDeclaration).webkitTextFillColor = '';
      highlightedElementRef.current.style.animation = '';
      highlightedElementRef.current.style.transition = '';
    }
    
    // Apply new highlight with animated gradient text color
    highlightedElementRef.current = element;
    
    // Save original styles to restore them later
    const originalColor = window.getComputedStyle(element).color;
    
    // Store original styles as data attributes for later restoration
    element.dataset.originalColor = originalColor;
    
    // Create a keyframe animation style if it doesn't exist yet
    if (!document.getElementById('text-gradient-animation')) {
      const style = document.createElement('style');
      style.id = 'text-gradient-animation';
      style.textContent = `
        @keyframes textGradientSlide {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Apply gradient text effect with Bard/Gemini-inspired colors
    // Blueish base with reddish highlight that moves across
    element.style.background = 'linear-gradient(72.83deg, #4285f4 11.63%, #a142f4 40.43%, #ea4335 68.07%)';
    element.style.backgroundSize = '200% auto';
    element.style.backgroundClip = 'text';
    (element.style as ExtendedCSSStyleDeclaration).webkitBackgroundClip = 'text';
    element.style.color = 'transparent';
    (element.style as ExtendedCSSStyleDeclaration).webkitTextFillColor = 'transparent';
    // Slow down the animation duration
    element.style.animation = 'textGradientSlide 12s ease-in-out infinite'; 
    element.style.transition = 'color 0.5s ease-out'; // Only transition color back
  }, []);

  // Remove highlight with smooth transition
  const removeHighlight = useCallback(() => {
    if (highlightedElementRef.current) {
      const element = highlightedElementRef.current;
      
      // Reset all styling properties applied during highlight
      element.style.background = '';
      element.style.backgroundSize = '';
      element.style.backgroundClip = '';
      (element.style as ExtendedCSSStyleDeclaration).webkitBackgroundClip = '';
      element.style.animation = '';
      (element.style as ExtendedCSSStyleDeclaration).webkitTextFillColor = ''; // Reset webkit fill color
      element.style.transition = ''; // Clear the transition property after use
      
      // Remove the inline color style to inherit the current theme's color
      element.style.removeProperty('color'); 
      
      // Clean up data attributes (still useful if we need original for other reasons)
      // delete element.dataset.originalColor; // Keep it for now, might be useful later
      
      // Clear reference
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
