import React from 'react';
import { 
  Box, 
  Drawer, 
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: isMobile ? (open ? DRAWER_WIDTH : 0) : (open ? DRAWER_WIDTH : 0),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: isMobile ? 'none' : '1px solid',
          borderColor: 'divider',
          transition: !isMobile ? theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }) : undefined,
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <Box
        sx={{
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {title || t('sidebar.right.title')}
        </Typography>
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