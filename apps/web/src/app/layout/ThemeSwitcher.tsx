import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../../features/theme/hooks';
import { useTranslation } from 'react-i18next';

export const ThemeSwitcher: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  return (
    <Tooltip title={mode === 'light' ? t('theme.dark') : t('theme.light')}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        aria-label={t('theme.toggle')}
        edge="end"
        size="large"
      >
        {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
}; 