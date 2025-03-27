import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useAppSelector, useAppDispatch, setTokens, clearTokens } from "@neurolink/shared";
import { Box, Typography, CircularProgress, Paper, Button } from "@mui/material";
import { Warning, SignIn, Lock } from "@phosphor-icons/react";

// Styled component for auth messages
const AuthMessageContainer = ({ 
    icon, 
    title, 
    message, 
    actionButton = null 
}: { 
    icon: React.ReactNode;
    title: string;
    message: string;
    actionButton?: React.ReactNode;
}) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 3,
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.2)' 
                : 'rgba(0, 0, 0, 0.02)'
        }}
    >
        <Paper
            elevation={2}
            sx={{
                padding: 4,
                borderRadius: 2,
                maxWidth: 500,
                width: '100%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}
        >
            <Box sx={{ mb: 2, color: 'primary.main' }}>{icon}</Box>
            <Typography variant="h5" component="h1" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                {message}
            </Typography>
            {actionButton}
        </Paper>
    </Box>
);

export const RequireAuth = ({ roles }: { roles?: string[] }) => {
    const auth = useAuth();
    const dispatch = useAppDispatch();
    // Safely access tokens state with optional chaining
    const userGroups = useAppSelector((state) => state.tokens?.groups || []);
    
    // Handle token management when auth state changes
    useEffect(() => {
        if (auth.isAuthenticated && auth.user) {
            // Extract tokens from auth user
            const accessToken = auth.user.access_token;
            const idToken = auth.user.id_token;
            const refreshToken = auth.user.refresh_token;
            
            // Extract groups from token claims if available
            const tokenClaims = auth.user.profile;
            const groups = Array.isArray(tokenClaims['cognito:groups']) 
                ? tokenClaims['cognito:groups'] 
                : [];
            
            // Store in Redux
            dispatch(setTokens({
                accessToken,
                idToken,
                refreshToken,
                groups
            }));

            console.log('Authentication successful, tokens stored');
        } else if (!auth.isLoading) {
            // Clear tokens when not authenticated
            dispatch(clearTokens());
        }
    }, [auth.isAuthenticated, auth.user, auth.isLoading, dispatch]);
    
    if (auth.isLoading) {
        return (
            <AuthMessageContainer
                icon={<CircularProgress size={50} />}
                title="Loading"
                message="Please wait while we initialize your session..."
            />
        );
    }
    
    if (auth.error) {
        return (
            <AuthMessageContainer
                icon={<Warning size={50} weight="duotone" />}
                title="Authentication Error"
                message={`We encountered an error during authentication: ${auth.error.message}`}
                actionButton={
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => auth.signinRedirect()}
                    >
                        Try Again
                    </Button>
                }
            />
        );
    }

    if (!auth.isAuthenticated) {
        auth.signinRedirect();
        return (
            <AuthMessageContainer
                icon={<SignIn size={50} weight="duotone" />}
                title="Redirecting to Login"
                message="You need to be logged in to access this page. Redirecting you to the login page..."
            />
        );
    }

    // Safely check roles with the non-null userGroups array
    if (roles && roles.length > 0 && !userGroups.some(group => roles.includes(group))) {
        return (
            <AuthMessageContainer
                icon={<Lock size={50} weight="duotone" />}
                title="Access Denied"
                message="You don't have permission to access this page. Please contact an administrator if you believe this is an error."
            />
        );
    }

    return <Outlet />;
};