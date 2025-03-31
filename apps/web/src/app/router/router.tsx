import { createBrowserRouter, RouteObject } from 'react-router-dom';
import AboutPage from '../../pages/about/AboutPage';
import AuthPage from '../../pages/auth/AuthPage';
import HomePage from '../../pages/home/HomePage';
import ProfilePage from '../../pages/profile/ProfilePage';
import App from '../layout/App';
// Removed non-existent imports
// import SettingsPage from '../../pages/settings/SettingsPage'; 
// import AccessibilityPage from '../../pages/accessibility/AccessibilityPage';
import PeoplePage from '../../pages/people/PeoplePage';
// import NotFoundPage from '../../pages/notFound/NotFoundPage'; // Removed non-existent import
import { RequireAuth } from './requireAuth';
import OnboardingPage from '../../pages/onboarding/OnboardingPage';

// Define public and authenticated routes
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />, // Main layout component
    children: [
      // Publicly accessible routes
      { path: 'about', element: <AboutPage /> },
      { path: 'auth', element: <AuthPage /> }, // Handles logout redirect

      // Routes requiring authentication
      { 
        element: <RequireAuth />, // Wrapper for authenticated routes
        children: [
          { index: true, element: <HomePage /> }, // Default route after login
          { path: 'profile', element: <ProfilePage /> },
          { path: 'onboarding', element: <OnboardingPage /> },
          { path: 'people', element: <PeoplePage /> }, 
          // Add other authenticated routes here
        ]
      },

      // Catch-all for 404 Not Found - Render a simple message or create a basic NotFoundPage
      // { path: '*', element: <NotFoundPage /> } 
      { path: '*', element: <div>404 - Page Not Found</div> } // Simple placeholder
    ]
  }
];

export const router = createBrowserRouter(routes);
