import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, setTokens, useAppSelector, store } from '@neurolink/shared';

/**
 * Component that syncs auth state with Redux
 * This keeps the AuthContext and Redux store decoupled
 */
export function AuthReduxSync() {
  const { authTokens } = useAuth();
  const dispatch = useAppDispatch();
  // Get current Redux tokens for comparison - adjust selector based on your actual state shape
  const reduxTokens = useAppSelector(state => state.tokens);
  
  // Store a timeout ref for debouncing
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store last synced token to avoid infinite loops
  const lastSyncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authTokens) {
      console.log('AuthReduxSync: No auth tokens, dispatching null to Redux');
      dispatch(setTokens({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
        groups: undefined
      }));
      lastSyncedTokenRef.current = null;
      return;
    }
    
    // Compare with last synced token to avoid unnecessary updates
    if (lastSyncedTokenRef.current === authTokens.accessToken) {
      console.log('AuthReduxSync: Token already synced, skipping update');
      return;
    }
    
    // Debug log to track token sync
    console.log('AuthReduxSync: Auth tokens changed, syncing with Redux', 
      authTokens?.accessToken ? 
        authTokens.accessToken.substring(0, 15) + '...' : 
        'null'
    );
    
    // Compare with Redux state for debugging
    if (authTokens?.accessToken !== reduxTokens?.accessToken) {
      console.log('AuthReduxSync: Tokens differ between AuthContext and Redux, updating', 
      {
        authContextToken: authTokens?.accessToken?.substring(0, 15) + '...',
        reduxToken: reduxTokens?.accessToken?.substring(0, 15) + '...'
      });
    }
    
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Debounce the sync operation to ensure we get the final state
    // Use a longer timeout to ensure all other state updates have completed
    syncTimeoutRef.current = setTimeout(() => {
      console.log('AuthReduxSync: Dispatching tokens to Redux now');
      // Dispatch auth tokens to Redux whenever they change
      dispatch(setTokens({
        accessToken: authTokens.accessToken,
        idToken: authTokens.idToken,
        refreshToken: authTokens.refreshToken,
        groups: undefined // Mobile app might not have groups like web app
      }));
      
      // Update last synced token
      lastSyncedTokenRef.current = authTokens.accessToken;
      
      // Double check after another delay to ensure Redux actually updated
      setTimeout(() => {
        const currentReduxTokens = store.getState().tokens;
        if (authTokens.accessToken !== currentReduxTokens?.accessToken) {
          console.log('AuthReduxSync: WARNING - Redux tokens still not in sync after update!');
          // Force another update as a last resort
          dispatch(setTokens({
            accessToken: authTokens.accessToken,
            idToken: authTokens.idToken,
            refreshToken: authTokens.refreshToken,
            groups: undefined
          }));
        } else {
          console.log('AuthReduxSync: Verification successful - tokens now in sync');
        }
      }, 300);
    }, 500);
    
    // Clean up timeout on unmount or when tokens change again
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  // Remove reduxTokens from dependency array to prevent potential loops
  }, [authTokens, dispatch]);

  // This component doesn't render anything
  return null;
}

export default AuthReduxSync; 