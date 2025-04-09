import { createRoot } from 'react-dom/client'
import './app/layout/index.css'
import 'react-toastify/dist/ReactToastify.css'
import { RouterProvider } from "react-router-dom";
import { router } from './app/router/router'
import { AuthProvider } from 'react-oidc-context';
import { cognitoAuthConfig } from './features/auth/auth';
import { Provider } from 'react-redux';
import { store } from './app/store/initStore';
// Initialize i18n
import './app/i18n/i18n';
// Import the ThemeProvider from our features
import { ThemeProvider } from './features/theme/ThemeProvider';

// Find the root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Create the root
const root = createRoot(rootElement);

// Render the app
root.render(
  <AuthProvider {...cognitoAuthConfig}>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  </AuthProvider>,
)
