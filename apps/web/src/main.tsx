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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </AuthProvider>
  </StrictMode>,
)
