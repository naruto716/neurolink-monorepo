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
        color: theme.palette.text.primary,
        ...(screenReaderEnabled && {
          '&:focus': {
            outline: 'none',
          },
          '&:focus::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme => 
              theme.palette.mode === 'light' 
                ? 'rgba(63, 81, 181, 0.08)' 
                : 'rgba(92, 107, 192, 0.15)',
            borderRadius: '4px',
            boxShadow: theme => 
              theme.palette.mode === 'light'
                ? '0 0 0 2px rgba(63, 81, 181, 0.2)'
                : '0 0 0 2px rgba(92, 107, 192, 0.3)',
            zIndex: -1,
          },
          '&:hover::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme => 
              theme.palette.mode === 'light' 
                ? 'rgba(63, 81, 181, 0.04)' 
                : 'rgba(92, 107, 192, 0.08)',
            borderRadius: '4px',
            zIndex: -1,
          },
        }),
        // The useTextToSpeech hook handles highlighting of the specific element
      }}
    />
  );
}; 