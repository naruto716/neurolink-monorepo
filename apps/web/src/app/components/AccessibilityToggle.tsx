import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import { useAccessibility } from '../../features/accessibility/hooks';
import { useTranslation } from 'react-i18next';

export const AccessibilityToggle: React.FC = () => {
  const { screenReaderEnabled, toggleScreenReader } = useAccessibility();
  const { t } = useTranslation();
  
  return (
    <Tooltip title={screenReaderEnabled ? t('accessibility.screenReader.toggle') : t('accessibility.screenReader.toggle')}>
      <IconButton
        onClick={toggleScreenReader}
        color="inherit"
        aria-label={t('accessibility.screenReader.toggle')}
        edge="end"
        size="large"
        sx={{
          backgroundColor: screenReaderEnabled ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        }}
      >
        <AccessibilityNewIcon />
      </IconButton>
    </Tooltip>
  );
}; 