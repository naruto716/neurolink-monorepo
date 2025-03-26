import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/layout/index.css'
import 'react-toastify/dist/ReactToastify.css'
import { RouterProvider } from "react-router-dom";
import { router } from './app/router/router'
import { AuthProvider } from 'react-oidc-context';
import { cognitoAuthConfig } from './features/auth/auth';
import { Provider } from 'react-redux';
import { store } from '@neurolink/shared';
import { AppThemeProvider } from './app/layout/ThemeContext';
import { AccessibilityProvider } from './app/utils/AccessibilityContext';
// Initialize i18n
import './app/i18n/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <Provider store={store}>
        <AppThemeProvider>
          <AccessibilityProvider>
            <RouterProvider router={router} />
          </AccessibilityProvider>
        </AppThemeProvider>
      </Provider>
    </AuthProvider>
  </StrictMode>,
)
