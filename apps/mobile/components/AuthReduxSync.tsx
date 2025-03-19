import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, setTokens } from '@neurolink/shared';

/**
 * Component that syncs auth state with Redux
 * This keeps the AuthContext and Redux store decoupled
 */
export function AuthReduxSync() {
  const { authTokens } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Dispatch auth tokens to Redux whenever they change
    dispatch(setTokens({
      accessToken: authTokens?.accessToken,
      idToken: authTokens?.idToken,
      refreshToken: authTokens?.refreshToken,
      groups: undefined // Mobile app might not have groups like web app
    }));
  }, [authTokens, dispatch]);

  // This component doesn't render anything
  return null;
}

export default AuthReduxSync; 