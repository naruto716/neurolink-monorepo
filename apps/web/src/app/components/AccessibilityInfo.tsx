import React from 'react';
import { Paper, Box, Container } from '@mui/material';
import { AccessibleTypography } from './AccessibleTypography';
import { useAccessibility } from '../../features/accessibility/hooks';
import { useTranslation } from 'react-i18next';

export const AccessibilityInfo: React.FC = () => {
  const { screenReaderEnabled } = useAccessibility();
  const { t } = useTranslation();
  
  // Determine key command based on OS
  const keyCommand = navigator.platform.includes('Mac') 
    ? t('accessibility.screenReader.macCommand', 'Command+Click') 
    : t('accessibility.screenReader.winCommand', 'Ctrl+Click');
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <AccessibleTypography variant="h4" gutterBottom>
          {t('accessibility.title')}
        </AccessibleTypography>
        
        <AccessibleTypography variant="body1" paragraph>
          {t('accessibility.description')}
        </AccessibleTypography>
        
        <AccessibleTypography variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('accessibility.screenReader.title')}
        </AccessibleTypography>
        
        <AccessibleTypography variant="body1" paragraph>
          {t('accessibility.screenReader.description', { keyCommand })}
        </AccessibleTypography>
        
        <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.light', 
          color: 'primary.contrastText', 
          borderRadius: 1,
          my: 2 
        }}>
          <AccessibleTypography variant="body1">
            {t('accessibility.screenReader.status', { 
              status: screenReaderEnabled 
                ? t('accessibility.screenReader.enabled') 
                : t('accessibility.screenReader.disabled')
            })}
            {screenReaderEnabled && ` ${t('accessibility.screenReader.try', { keyCommand })}`}
          </AccessibleTypography>
        </Box>
        
        <AccessibleTypography variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('accessibility.theme.title')}
        </AccessibleTypography>
        
        <AccessibleTypography variant="body1" paragraph>
          {t('accessibility.theme.description')}
        </AccessibleTypography>
      </Paper>
    </Container>
  );
}; 