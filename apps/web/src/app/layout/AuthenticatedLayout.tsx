import React from 'react';
import { Outlet } from 'react-router-dom';
import { ChatProvider } from '../../features/chat/ChatProvider';

// This component wraps authenticated routes with the ChatProvider
// ensuring ChatProvider only mounts after RequireAuth succeeds.
const AuthenticatedLayout: React.FC = () => {
  return (
    <ChatProvider>
      <Outlet /> {/* Renders the actual authenticated route component */}
    </ChatProvider>
  );
};

export default AuthenticatedLayout;