import { Outlet, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useAppDispatch, useAppSelector } from "../store/initStore";
import { 
  setTokens,
  fetchUser,
  selectUserLoadingStatus,
  selectNeedsOnboarding,
  setOnboardingStatus
} from "@neurolink/shared";
import apiClient from "../api/apiClient";
import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import Layout from "./Layout";

function App() {
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Redux state selectors
  const userStatus = useAppSelector(selectUserLoadingStatus);
  const needsOnboarding = useAppSelector(selectNeedsOnboarding);

  // Set tokens on auth change
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const groups = auth.user?.profile["cognito:groups"] as string[] | undefined;
      dispatch(setTokens({
        accessToken: auth.user.access_token,
        idToken: auth.user.id_token,
        refreshToken: auth.user.refresh_token,
        groups: groups
      }));

      if (window.location.search.includes('code=')) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [auth.isAuthenticated, auth.user, dispatch]);

  // Fetch user data when authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.isAuthenticated && auth.user && !hasFetched) {
        setFetchError(null);
        
        try {
          // Start with a clean slate
          dispatch(setOnboardingStatus(false));
          
          // Fetch the user data, passing the apiClient instance
          await dispatch(fetchUser({ apiClient })).unwrap();
        } catch (error) {
          // Handle error case
          const errorMessage = typeof error === 'string' ? error : 'Unknown error';
          setFetchError(errorMessage);
          
          // Force onboarding if needed
          if (errorMessage.includes('not found') || errorMessage.includes('needs onboarding')) {
            dispatch(setOnboardingStatus(false));
          }
        } finally {
          setHasFetched(true);
        }
      }
    };
    
    fetchUserData();
  }, [auth.isAuthenticated, auth.user, dispatch, hasFetched]);

  // Handle loading states
  if (auth.isAuthenticated && userStatus === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Redirect to onboarding if needed
  if (auth.isAuthenticated && hasFetched && needsOnboarding) {
    return <Navigate to="/onboarding" />;
  }

  // Manual check for error conditions
  if (auth.isAuthenticated && hasFetched && fetchError && 
     (fetchError.includes('not found') || fetchError.includes('needs onboarding'))) {
    return <Navigate to="/onboarding" />;
  }

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {fetchError && !needsOnboarding && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          Error loading profile: {fetchError}
        </div>
      )}
      <Layout>
        <Outlet />
      </Layout>
    </>
  );
}

export default App; 