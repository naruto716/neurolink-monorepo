import { createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../../pages/home/HomePage";
import AboutPage from "../../pages/about/AboutPage";
import ProfilePage from "../../pages/profile/ProfilePage";
import { RequireAuth } from "./requireAuth";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { path: '', element: <HomePage /> },
            { path: 'about', element: <AboutPage /> },
            { element: <RequireAuth />, children: [
                { path: 'profile', element: <ProfilePage /> }
            ] }
        ]
    }
]);
