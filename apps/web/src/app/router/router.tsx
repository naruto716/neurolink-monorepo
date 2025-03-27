import { createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../../pages/home/HomePage";
import AboutPage from "../../pages/about/AboutPage";
import ProfilePage from "../../pages/profile/ProfilePage";
import AuthPage from "../../pages/auth/AuthPage";
import { RequireAuth } from "./requireAuth";
import { AccessibilityInfo } from "../components/AccessibilityInfo";

// Simple placeholder for the onboarding page
const OnboardingPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Welcome to Neurolink!</h1>
    <p>This is a simple placeholder for the onboarding process.</p>
    <p>You need to complete the onboarding process to use the application.</p>
    <p>The actual onboarding flow will be implemented later.</p>
  </div>
);

export const router = createBrowserRouter([
    {
        path: '/auth',
        element: <AuthPage />
    },
    {
        path: '/',
        element: <RequireAuth />,
        children: [
            {
                element: <App />,
                children: [
                    { path: '', element: <HomePage /> },
                    { path: 'about', element: <AboutPage /> },
                    { path: 'accessibility', element: <AccessibilityInfo /> },
                    { path: 'profile', element: <ProfilePage /> },
                ]
            },
            { path: 'onboarding', element: <OnboardingPage /> }
        ]
    }
]);
