import React, { useMemo } from 'react';
import { Box, Link } from '@mui/material'; // Removed Typography
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AccessibleTypography } from './AccessibleTypography'; // Added AccessibleTypography

interface BreadcrumbProps {
  // Optional custom items to override automatic breadcrumb creation
  customItems?: Array<{
    label: string;
    path: string;
  }>;
}

interface BreadcrumbRoute {
  path: string;
  label: string;
  isLast: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ customItems }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const routeNameMap: Record<string, string> = useMemo(() => {
    return {
      '/': t('nav.home'),
      '/dashboard': t('nav.dashboard'),
      '/about': t('nav.about'),
      '/profile': t('nav.profile'),
      '/accessibility': t('nav.accessibility'),
      '/settings': t('nav.settings'),
      // Add onboarding route if needed, or rely on customItems
      '/onboarding': t('nav.onboarding'), 
    };
  }, [t]);
  
  // Creates breadcrumb route objects from the current location path
  const routes = useMemo(() => {
    if (customItems) {
      return customItems.map((item, index) => ({
        path: item.path,
        label: item.label,
        isLast: index === customItems.length - 1
      }));
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // If we're at the root, show just Home
    if (pathSegments.length === 0) {
      return [{ path: '/', label: routeNameMap['/'], isLast: true }];
    }

    // Build the breadcrumb items
    const breadcrumbRoutes: BreadcrumbRoute[] = [
      { path: '/', label: routeNameMap['/'], isLast: false }
    ];

    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      const label = routeNameMap[currentPath] || 
        // Capitalize the first letter and replace dashes and underscores with spaces
        segment.charAt(0).toUpperCase() + 
        segment.slice(1).replace(/[-_]/g, ' ');
      
      breadcrumbRoutes.push({
        path: currentPath,
        label,
        isLast
      });
    });

    return breadcrumbRoutes;
  }, [location.pathname, customItems, routeNameMap]);

  // Always show breadcrumbs, even on the home page
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {routes.map((route, index) => (
        <React.Fragment key={route.path}>
          {index > 0 && (
            /* Replaced Typography */
            <AccessibleTypography
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '14px',
              }}
            >
              /
            </AccessibleTypography>
          )}
          
          {route.isLast ? (
            /* Replaced Typography */
            <AccessibleTypography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {route.label}
            </AccessibleTypography>
          ) : (
            <Link
              component={RouterLink}
              to={route.path}
              underline="hover"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                fontSize: '14px',
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {/* Use AccessibleTypography inside Link */}
              <AccessibleTypography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                {route.label}
              </AccessibleTypography>
            </Link>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default Breadcrumb;
