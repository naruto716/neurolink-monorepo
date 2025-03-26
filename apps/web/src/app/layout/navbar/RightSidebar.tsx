import React from 'react';
import { 
  Box, 
  Drawer, 
  IconButton, 
  Typography,
  useTheme
} from '@mui/material';
import { ChevronRight, ChevronLeft } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const DRAWER_WIDTH = 280;

export const RightSidebar: React.FC<RightSidebarProps> = ({ 
  open, 
  onClose, 
  title = '', 
  children 
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
        },
      }}
    >
      <Box
        sx={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {title || t('sidebar.right.title')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          {theme.direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>
      <Box sx={{ p: 2 }}>
        {children || (
          <Typography color="text.secondary">
            {t('sidebar.right.noContent')}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default RightSidebar; 