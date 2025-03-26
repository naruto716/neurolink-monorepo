import React, { useRef, useCallback, forwardRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import { useAccessibility } from '../../features/accessibility/hooks';

// Higher-order component to add screen reader functionality to any component
export const withScreenReader = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = forwardRef<HTMLElement, P & { className?: string; style?: React.CSSProperties }>(
    (props, ref) => {
      const { screenReaderEnabled, speak, isSpeaking } = useAccessibility();
      const elementRef = useRef<HTMLElement>(null);
      
      const combinedRef = (node: HTMLElement | null) => {
        // Only assign if node is not null
        if (node) {
          // Use mutable ref workaround
          if (elementRef.current !== node) {
            (elementRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
          
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }
      };

      // Handle cmd/ctrl + click events
      const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (!screenReaderEnabled) return;
        
        // Check for cmd (macOS) or ctrl (Windows) key
        if ((event.metaKey || event.ctrlKey) && elementRef.current) {
          // Get text content of the element
          const text = elementRef.current.textContent;
          if (text) {
            // Prevent default behavior
            event.preventDefault();
            // Speak the text
            speak(text, elementRef.current);
          }
        }
        
        // Call original onClick if exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const originalOnClick = (props as any).onClick;
        if (originalOnClick) {
          originalOnClick(event);
        }
      }, [screenReaderEnabled, speak, props]);

      // Apply screen reader styles and properties when enabled
      const getScreenReaderProps = () => {
        if (!screenReaderEnabled) return {};
        
        return {
          onClick: handleClick,
          'aria-live': isSpeaking ? 'assertive' : 'off',
          role: 'button',
          tabIndex: 0,
          style: {
            ...(props.style || {}),
            cursor: 'pointer',
          },
          className: `${props.className || ''} screen-reader-enabled`,
        };
      };

      return (
        <Component
          {...props as P}
          {...getScreenReaderProps()}
          ref={combinedRef}
        />
      );
    }
  );

  WrappedComponent.displayName = `withScreenReader(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent as ForwardRefExoticComponent<P & { className?: string; style?: React.CSSProperties } & RefAttributes<HTMLElement>>;
}; 