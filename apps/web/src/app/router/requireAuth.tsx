import { Outlet } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export const RequireAuth = () => {
    const auth = useAuth();
    
    if (auth.isLoading) {
        return <div>Loading...</div>;
    }
    
    if (auth.error) {
        return <div>Encountering error... {auth.error.message}</div>;
    }

    if (!auth.isAuthenticated) {
        auth.signinRedirect();
        return <div>Redirecting to login...</div>;
    }

    return <Outlet />;
};