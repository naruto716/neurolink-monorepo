import { Outlet } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useAppSelector } from "@neurolink/shared";

export const RequireAuth = ({ roles }: { roles?: string[] }) => {
    const auth = useAuth();
    const userGroups = useAppSelector((state) => state.tokens.groups);
    
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

    if (roles && !userGroups?.some(group => roles.includes(group))) {
        return <div>You are not authorized to access this page</div>;
    }

    return <Outlet />;
};