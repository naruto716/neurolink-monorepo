import { createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../../pages/home/HomePage";
import AboutPage from "../../pages/about/AboutPage";
import ProfilePage from "../../pages/profile/ProfilePage";
import AuthPage from "../../pages/auth/AuthPage";
import { RequireAuth } from "./requireAuth";
import { AccessibilityInfo } from "../components/AccessibilityInfo";

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
                    { path: 'profile', element: <ProfilePage /> }
                ]
            }
        ]
    }
]);
