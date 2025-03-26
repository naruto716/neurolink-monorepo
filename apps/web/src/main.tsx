import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/layout/index.css'
import 'react-toastify/dist/ReactToastify.css'
import { RouterProvider } from "react-router-dom";
import { router } from './app/router/router'
import { AuthProvider } from 'react-oidc-context';
import { cognitoAuthConfig } from './features/auth/auth';
import { Provider } from 'react-redux';
import { initStore } from './app/store/initStore';
// Initialize i18n
import './app/i18n/i18n';
// Import the ThemeProvider from our features
import { ThemeProvider } from './features/theme/ThemeProvider';

// Initialize the store with our reducers
const store = initStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <Provider store={store}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </Provider>
    </AuthProvider>
  </StrictMode>,
)
