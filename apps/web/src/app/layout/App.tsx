import { Outlet } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useAppDispatch, setTokens } from "@neurolink/shared";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import Layout from "./Layout";

function App() {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const groups = auth.user?.profile["cognito:groups"] as string[] | undefined;
    dispatch(setTokens({
      accessToken: auth?.user?.access_token,
      idToken: auth?.user?.id_token,
      refreshToken: auth?.user?.refresh_token,
      groups: groups
    }));

    if (auth.isAuthenticated && window.location.search.includes('code=')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [auth?.user, auth.isAuthenticated, dispatch]);

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Layout>
        <Outlet />
      </Layout>
    </>
  );
}

export default App; 