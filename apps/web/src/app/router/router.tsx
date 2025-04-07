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
// import FriendListPage from '../../pages/people/FriendListPage'; // Removed old page import
// import NotFoundPage from '../../pages/notFound/NotFoundPage'; // Removed non-existent import
import { RequireAuth } from './requireAuth';
import OnboardingPage from '../../pages/onboarding/OnboardingPage';
import Layout from '../layout/Layout';

// Define public and authenticated routes
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />, // Main app component handling auth
    children: [
      // Authenticated routes (RequireAuth)
      { 
        element: <RequireAuth />,
        children: [
          // Authenticated routes WITH Layout
          {
            element: <Layout />,
            children: [
              { index: true, element: <SocialPage /> }, // Default route after login
              // Removed profile route
              { path: 'people', element: <PeoplePage /> },
              { path: 'people/:username', element: <UserProfilePage /> }, // Keep existing user profile route
              { path: 'profile/edit', element: <EditProfilePage /> }, // Add route for editing profile
              { path: 'chat', element: <ChatPage /> }, // Add route for chat page
              // { path: 'people/:username/friends', element: <FriendListPage /> }, // Removed old page route
              // Add other authenticated routes that need Layout here
            ]
          },
          
          // Authenticated routes WITHOUT Layout
          { path: 'onboarding', element: <OnboardingPage /> },
          // Add other authenticated routes that don't need Layout here
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
