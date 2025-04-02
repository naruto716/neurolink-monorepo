import { Box, styled } from '@mui/material';
import React, { useEffect, useRef } from 'react';

// Define initial values for CSS variables and colors outside component
const initialGradientX = '100%';
const initialGradientY = '0%';
const color1 = '#1a4f5a';
const color2 = '#3a2a54';

const StyledBackgroundGradient = styled(Box)({
  '--gradient-x': initialGradientX, // Define CSS variables
  '--gradient-y': initialGradientY,
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  // Construct background using CSS variables
  background: `radial-gradient(ellipse at var(--gradient-x) var(--gradient-y), ${color1}, ${color2})`,
  zIndex: -1,
  height: '100vh',
  width: '100vw',
  overflow: 'hidden', // Ensure comma is here if needed, but it's the last property
}); // Closing parenthesis for styled(Box)

const DynamicBackground: React.FC = () => {
  const animationFrameId = useRef<number | null>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // Ref for the DOM element

  // Effect for animating the background gradient
  useEffect(() => {
    const startTime = Date.now();
    // Using constants defined outside

    const animateGradient = () => {
      const element = backgroundRef.current;
      if (!element) return; // Exit if ref is not attached yet

      const elapsedTime = Date.now() - startTime;
      // Oscillate position over 20 seconds for a slower effect
      const period = 20000;
      // Move X between 25% and 75%
      const xPercent = 50 + 25 * Math.sin((elapsedTime / period) * 2 * Math.PI);
      // Move Y between 0% and 100%
      const yPercent = 50 + 50 * Math.cos((elapsedTime / period) * 2 * Math.PI);

      // Update CSS variables directly on the DOM element
      element.style.setProperty('--gradient-x', `${xPercent.toFixed(2)}%`);
      element.style.setProperty('--gradient-y', `${yPercent.toFixed(2)}%`);

      animationFrameId.current = requestAnimationFrame(animateGradient);
    };

    // Start the animation
    animationFrameId.current = requestAnimationFrame(animateGradient);

    // Cleanup function to cancel animation on component unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Pass the ref to the styled component
  return <StyledBackgroundGradient ref={backgroundRef} />;
};

export default DynamicBackground;
