import React, { useState } from 'react';
import { 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  Switch, 
  Typography, 
  Box,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Wheelchair, TextAa, SpeakerHigh, TextT } from '@phosphor-icons/react';
import { useAccessibility } from '../../features/accessibility/hooks';
import { useTranslation } from 'react-i18next';

export const AccessibilityToggle: React.FC = () => {
  const { screenReaderEnabled, toggleScreenReader, speak } = useAccessibility();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Demo text to speech
  const handleDemoSpeech = () => {
    speak(t('accessibility.demo.text', 'This is a test of the screen reader functionality.'));
  };

  return (
    <>
      <Tooltip title={t('accessibility.options')}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-label={t('accessibility.options')}
          size="small"
        >
          <Wheelchair size={20} />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="accessibility-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'accessibility-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t('accessibility.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('accessibility.subtitle')}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 1 }} />
        
        <MenuItem onClick={toggleScreenReader} sx={{ height: 44 }}>
          <ListItemIcon>
            <TextAa size={22} />
          </ListItemIcon>
          <ListItemText primary={t('accessibility.screenReader.title')} />
          <Switch 
            edge="end" 
            checked={screenReaderEnabled} 
            size="small"
            inputProps={{
              'aria-labelledby': 'screen-reader-switch',
            }}
          />
        </MenuItem>
        
        <MenuItem onClick={handleDemoSpeech} disabled={!screenReaderEnabled} sx={{ height: 44 }}>
          <ListItemIcon>
            <SpeakerHigh size={22} />
          </ListItemIcon>
          <ListItemText primary={t('accessibility.demo.title')} />
        </MenuItem>
        
        <MenuItem sx={{ height: 44 }}>
          <ListItemIcon>
            <TextT size={22} />
          </ListItemIcon>
          <ListItemText primary={t('accessibility.fontSize')} />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" sx={{ p: 0.5 }}>
              <Typography variant="body2">A-</Typography>
            </IconButton>
            <IconButton size="small" sx={{ p: 0.5 }}>
              <Typography variant="body2">A+</Typography>
            </IconButton>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}; 