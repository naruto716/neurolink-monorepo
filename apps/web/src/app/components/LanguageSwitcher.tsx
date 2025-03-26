import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { Translate, Check } from '@phosphor-icons/react';

const LANGUAGES = [
  { 
    code: 'en', 
    name: 'English',
    flag: '🇺🇸',
    nativeName: 'English'
  },
  { 
    code: 'es', 
    name: 'Spanish',
    flag: '🇪🇸',
    nativeName: 'Español'
  },
  { 
    code: 'fr', 
    name: 'French',
    flag: '🇫🇷',
    nativeName: 'Français'
  }
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <>
      <Tooltip title={t('language.select')}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-label={t('language.select')}
          size="small"
        >
          <Translate size={20} />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: '200px' }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t('language.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('language.selectLanguage')}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 1 }} />
        
        {LANGUAGES.map((language) => {
          const isSelected = currentLanguage === language.code;
          
          return (
            <MenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              selected={isSelected}
              sx={{ height: 44 }}
            >
              <ListItemIcon>
                <Box component="span" sx={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>
                  {language.flag}
                </Box>
              </ListItemIcon>
              
              <ListItemText 
                primary={language.nativeName} 
                secondary={language.name !== language.nativeName ? language.name : undefined}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 400
                }}
              />
              
              {isSelected && (
                <Check size={20} weight="bold" color="var(--mui-palette-primary-main)" />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}; 