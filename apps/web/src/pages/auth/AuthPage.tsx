import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { useAuth } from 'react-oidc-context';
import { signOutRedirect } from '../../features/auth/auth';
import { useAppDispatch, clearTokens } from '@neurolink/shared';

const AuthPage = () => {
    const theme = useTheme();
    const auth = useAuth();
    const dispatch = useAppDispatch();
    
    // Immediately logout on page load
    useEffect(() => {
        const logout = async () => {
            dispatch(clearTokens());
            auth.removeUser();
            signOutRedirect();
        };
        
        // Small delay to ensure UI renders before redirect
        const timer = setTimeout(() => {
            logout();
        }, 500);
        
        return () => clearTimeout(timer);
    }, [auth, dispatch]);
    
    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.palette.background.default,
                padding: 2
            }}
        >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
                Logging you out...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we sign you out of your account.
            </Typography>
        </Box>
    );
};

export default AuthPage; 