import React from 'react';
import DynamicBackground from './components/DynamicBackground';
import OnboardingContent from './components/OnboardingContent';

const OnboardingPage: React.FC = () => {
  return (
    <>
      <DynamicBackground />
      <OnboardingContent />
    </>
  );
};

export default OnboardingPage;
