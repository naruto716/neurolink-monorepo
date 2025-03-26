## Breadcrumb

I understand your confusion. Let me explain how the breadcrumb system works and how to set it up for new pages:

### How the Breadcrumb System Works

The breadcrumb component we've built has two methods of operation:

1. **Automatic Breadcrumbs**: For most pages, breadcrumbs are generated automatically from the URL path.
2. **Custom Breadcrumbs**: For special cases, you can manually define breadcrumbs.

### Setting Up Breadcrumbs for a New Page

#### Option 1: Let it work automatically

If you create a new page at a URL path like `/settings/privacy`, the breadcrumb will automatically show:
`Home / Settings / Privacy`

You don't need to do anything special - it just works by parsing the URL.

#### Option 2: Add friendly names to the route map

If you want a nicer display name than what's auto-generated from the URL, add your route to the `routeNameMap` in the Breadcrumb component:

```typescript jsx:apps/web/src/app/components/Breadcrumb.tsx
// ... existing imports

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
      // Add your new routes here, for example:
      '/settings/privacy': 'Privacy Settings',
      '/projects/new': 'Create Project',
    };
  }, [t]);
  
  // ... rest of the component
```
#### Option 3: For special pages, use custom breadcrumbs

If a page needs a completely custom breadcrumb path, you can set specific breadcrumb items in the page component:

```tsx
// Example: YourNewPage.tsx
import React from 'react';
import { Box } from '@mui/material';
import Breadcrumb from '../../components/Breadcrumb';

const YourNewPage = () => {
  // Define custom breadcrumb items for this specific page
  const customBreadcrumbItems = [
    { label: 'Special Section', path: '/special' },
    { label: 'Your Page Title', path: '/special/your-page' }
  ];
  
  return (
    <Box>
      {/* Option to override breadcrumb directly in the page */}
      <Breadcrumb customItems={customBreadcrumbItems} />
      
      {/* Page content */}
      <h1>Your Page Content</h1>
      {/* ... */}
    </Box>
  );
};
```

However, since we're already handling breadcrumbs in the Navbar, it's cleaner to modify the existing breadcrumb setup:

```tsx
// In your page component
import { useBreadcrumb } from '../../hooks/useBreadcrumb'; // You would create this

const YourNewPage = () => {
  // Set custom breadcrumb on page load
  useBreadcrumb([
    { label: 'Special Section', path: '/special' },
    { label: 'Your Page Title', path: '/special/your-page' }
  ]);
  
  return (
    // Your page content without breadcrumb component
  );
};
```

### Simple Approach

For most new pages, you don't need to do anything - the breadcrumbs will work automatically based on the URL.

If you want a nicer display name, just add your new route to the `routeNameMap` in the Breadcrumb component as shown above.

Would you like me to create a useBreadcrumb hook to make it easier to set custom breadcrumbs from any page?
