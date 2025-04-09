import { createBrowserRouter, RouteObject } from 'react-router-dom';
import AboutPage from '../../pages/about/AboutPage';
import AuthPage from '../../pages/auth/AuthPage';
import SocialPage from '../../pages/social/SocialPage';
// Removed ProfilePage import
import App from '../layout/App';
// Removed non-existent imports
// import SettingsPage from '../../pages/settings/SettingsPage';
// import AccessibilityPage from '../../pages/accessibility/AccessibilityPage';
import PeoplePage from '../../pages/people/PeoplePage';
import UserProfilePage from '../../pages/people/UserProfilePage';
import EditProfilePage from '../../pages/profile/EditProfilePage'; // Import the new page
import ChatPage from '../../pages/chat/ChatPage'; // Import ChatPage
import CommitmentPage from '../../pages/commitments/CommitmentPage'; // Import CommitmentPage
import ForumPage from '../../pages/forum/ForumPage'; // Import ForumPage
// Removed CommitmentDetail import as it will be a modal
// import CommitmentDetail from '../../pages/commitments/components/CommitmentDetail';
// import FriendListPage from '../../pages/people/FriendListPage'; // Removed old page import
// import NotFoundPage from '../../pages/notFound/NotFoundPage'; // Removed non-existent import
import { RequireAuth } from './requireAuth';
import OnboardingPage from '../../pages/onboarding/OnboardingPage';
import Layout from '../layout/Layout';
import AuthenticatedLayout from '../layout/AuthenticatedLayout'; // Import the new layout

// Define public and authenticated routes
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />, // Main app component handling auth
    children: [
      // Authenticated routes (RequireAuth)
      {
        // This route ensures authentication via RequireAuth
        element: <RequireAuth />,
        children: [
          // All routes under RequireAuth now go through AuthenticatedLayout
          {
            element: <AuthenticatedLayout />, // Apply ChatProvider here
            children: [
              // Authenticated routes WITH standard Layout (nested inside AuthenticatedLayout)
              {
                element: <Layout />,
                children: [
                  { index: true, element: <SocialPage /> },
                  { path: 'people', element: <PeoplePage /> },
                  { path: 'people/:username', element: <UserProfilePage /> },
                  { path: 'profile/edit', element: <EditProfilePage /> },
                  { path: 'chat', element: <ChatPage /> },
                  { path: 'forum', element: <ForumPage /> }, // Use ForumPage component
                  { path: 'forum/posts/:postId', element: <div>Forum Post Detail Page Placeholder</div> }, // Add Forum Post Detail route
                  { path: 'commitments', element: <CommitmentPage /> },
                  { path: 'commitments/:subpage', element: <CommitmentPage /> },
                  // Removed Commitment Detail route
                  // Add other routes needing standard Layout here
                ]
              },
            ]
          },
          // Authenticated routes WITHOUT standard Layout (but still need ChatProvider)
          { path: 'onboarding', element: <OnboardingPage /> },
        ]
      },

      // Public routes (no RequireAuth)
      // Public routes WITH Layout
      {
        element: <Layout />,
        children: [
          { path: 'about', element: <AboutPage /> },
          // Add other public routes that need Layout here
        ]
      },

      // Public routes WITHOUT Layout
      { path: 'auth', element: <AuthPage /> }, // Handles logout redirect

      // Catch-all for 404 Not Found
      { path: '*', element: <div>404 - Page Not Found</div> }
    ]
  }
];

export const router = createBrowserRouter(routes);
