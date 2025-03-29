import React, { useRef, useCallback } from 'react';
import { Typography, TypographyProps, useTheme } from '@mui/material';
import { useAccessibility } from '../../features/accessibility/hooks';

export const AccessibleTypography: React.FC<TypographyProps> = (props) => {
  const { screenReaderEnabled, speak, isSpeaking } = useAccessibility();
  const elementRef = useRef<HTMLElement>(null);
  const { onClick } = props;
  const theme = useTheme();
  
  // Handle cmd/ctrl + click events
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!screenReaderEnabled) return;
    
    // Check for cmd (macOS) or ctrl (Windows) key
    if ((event.metaKey || event.ctrlKey) && elementRef.current) {
      // Get text content of the element
      const text = elementRef.current.textContent;
      if (text) {
        // Prevent default behavior (like opening a new tab)
        event.preventDefault();
        // Speak the text
        speak(text, elementRef.current);
      }
    }
    
    // Call original onClick if provided
    if (onClick) {
      onClick(event);
    }
  }, [screenReaderEnabled, speak, onClick]);
  
  return (
    <Typography
      {...props}
      ref={elementRef}
      onClick={handleClick}
      aria-live={isSpeaking ? "assertive" : "off"}
      role={screenReaderEnabled ? "button" : undefined}
      tabIndex={screenReaderEnabled ? 0 : undefined}
      sx={{
        ...props.sx,
        position: 'relative',
        transition: 'all 0.3s ease',
        color: theme.palette.text.primary, // Ensure default color is set
        // Apply only cursor style when screen reader is enabled, remove focus/hover effects
        ...(screenReaderEnabled && { 
          // cursor: 'pointer', // Removed pointer cursor
        }),
        // The useTextToSpeech hook handles highlighting of the specific element
      }}
    />
  );
};
