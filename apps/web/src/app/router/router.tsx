import { createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../../pages/home/HomePage";
import AboutPage from "../../pages/about/AboutPage";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { path: '', element: <HomePage /> },
            { path: 'about', element: <AboutPage /> }
        ]
    }
]);
