import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@neurolink/shared';
import { 
  selectScreenReaderEnabled, 
  selectIsSpeaking, 
  toggleScreenReader, 
  setScreenReaderEnabled 
} from './accessibilitySlice';
import { useTextToSpeech } from './useTextToSpeech';

export const useAccessibility = () => {
  const dispatch = useAppDispatch();
  const screenReaderEnabled = useAppSelector(selectScreenReaderEnabled);
  const isSpeaking = useAppSelector(selectIsSpeaking);
  
  const { speak, stop, isSupported } = useTextToSpeech({
    rate: 0.9, // Slightly slower for better comprehension
    pitch: 1,
    volume: 1,
  });
  
  const handleToggleScreenReader = useCallback(() => {
    dispatch(toggleScreenReader());
  }, [dispatch]);
  
  const handleSetScreenReaderEnabled = useCallback((enabled: boolean) => {
    dispatch(setScreenReaderEnabled(enabled));
  }, [dispatch]);
  
  return {
    screenReaderEnabled,
    isSpeaking,
    isSupported,
    toggleScreenReader: handleToggleScreenReader,
    setScreenReaderEnabled: handleSetScreenReaderEnabled,
    speak,
    stop
  };
}; 