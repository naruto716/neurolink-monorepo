import {
  fetchUser,
  selectNeedsOnboarding,
  selectUserLoadingStatus,
  setOnboardingStatus,
  setTokens
} from "@neurolink/shared";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, Outlet, useLocation } from "react-router-dom"; // Added useLocation
import { ToastContainer } from 'react-toastify';
import apiClient from "../api/apiClient";
import { useAppDispatch, useAppSelector } from "../store/initStore";


function App() {
  const location = useLocation(); // Add this line
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // Re-add fetchError state
  
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

  // Redirect to onboarding if needed AND not already there
  if (auth.isAuthenticated && hasFetched && needsOnboarding && location.pathname !== '/onboarding') { // Added location check
    console.log('Redirecting to onboarding because needsOnboarding is true'); // Keep log for now
    return <Navigate to="/onboarding" replace />; // Use Navigate component
  }

  // Manual check for error conditions AND not already on onboarding
  if (auth.isAuthenticated && hasFetched && fetchError &&
     (fetchError.includes('not found') || fetchError.includes('needs onboarding')) &&
     location.pathname !== '/onboarding') { // Added location check
    console.log('Redirecting to onboarding due to fetch error'); // Keep log for now
    return <Navigate to="/onboarding" replace />; // Use Navigate component
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
      <Outlet />
    </>
  );
}

export default App; 