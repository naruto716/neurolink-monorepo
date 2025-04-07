import React, { useState, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StreamVideoClient, StreamVideo, User } from '@stream-io/video-react-sdk';
import { AppDispatch } from '../../app/store/initStore';
import {
  selectChatConnectionStatus, // Reuse chat status to know when user is authenticated
  // Removed unused selectChatUserId import
  fetchChatToken             // Reuse token fetching logic (assuming same token works)
} from '@neurolink/shared';
import { selectCurrentUser } from '@neurolink/shared';
import apiClient from '../../app/api/apiClient';
import { Box, CircularProgress } from '@mui/material'; // For loading state
import { AccessibleTypography } from '../../app/components/AccessibleTypography'; // For accessible text

interface VideoProviderProps {
  children: ReactNode;
}

export const VideoProvider: React.FC<VideoProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>(); // Although not used for dispatching video state yet, keep for consistency
  const connectionStatus = useSelector(selectChatConnectionStatus); // Use chat status as proxy for readiness
  // Removed unused currentChatUserId selector
  const loggedInUser = useSelector(selectCurrentUser);

  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[VideoProvider Effect] Status: ${connectionStatus}, HasClient: ${!!videoClient}, IsConnecting: ${isConnecting}`);
    // Only attempt connection if chat is connected (implies user is logged in and token is likely available)
    // and if we aren't already connected or connecting.
    if (connectionStatus !== 'connected' || videoClient || isConnecting) {
       console.log(`[VideoProvider Effect] Skipping initialization.`);
       // If chat disconnects or user changes, disconnect video client
       // If chat disconnects or user changes while video client exists, clear video client state
      if ((connectionStatus === 'disconnected' || connectionStatus === 'error') && videoClient) {
          console.log('Chat disconnected or errored, clearing video client state...');
          // No explicit disconnect needed for Video SDK client, just clear state
          setVideoClient(null);
          setIsConnecting(false); // Reset connection attempt flag
           setError(null);
       }
      return;
    }

    // Ensure we have the necessary user info
    if (!loggedInUser?.username) {
      console.log("[VideoProvider Effect] App user not logged in, skipping video client initialization.");
      return;
    }

    let clientInstance: StreamVideoClient | null = null;
    const targetUsername = loggedInUser.username;

    const initializeVideo = async () => {
      console.log("[VideoProvider Effect] Starting initialization...");
      setIsConnecting(true);
      setError(null);
      console.log(`Attempting to initialize Stream Video for user: ${targetUsername}...`);

      try {
        // --- Fetch Credentials (reuse chat token logic) ---
        console.log("[VideoProvider Effect] Fetching token...");
        // We assume the same token works for video. If not, this needs adjustment.
        const { apiKey, token, userId } = await fetchChatToken(apiClient);
        console.log(`[VideoProvider Effect] Token fetched successfully for user: ${userId}`);

        // Validate user ID consistency
        if (userId !== targetUsername) {
          console.error(`User ID mismatch! Expected: ${targetUsername}, Received from token endpoint: ${userId}. Check API interceptor/backend logic.`);
          // Decide how to handle mismatch - throw error or proceed with caution?
          // For now, proceed but log the error.
        }

        // --- Initialize Video Client ---
        const videoUser: User = {
          id: userId,
          name: loggedInUser.displayName || userId, // Use displayName if available, fallback to userId
          image: loggedInUser.profilePicture, // Use profilePicture if available
          // Add other custom user data if needed
        };

        console.log(`[VideoProvider Effect] Initializing Video Client with User:`, videoUser);
        clientInstance = new StreamVideoClient({ apiKey, user: videoUser, token });

        // --- Connect Video Client ---
        // Note: Video client connection doesn't need explicit connect() call like chat V1
        // It connects automatically when components like StreamVideo are mounted or call methods are used.
        // However, we set the state here to make it available.
        console.log(`[VideoProvider Effect] Video Client for user ${userId} initialized.`);
        setVideoClient(clientInstance);
        console.log(`[VideoProvider Effect] videoClient state set.`);

      } catch (err: unknown) {
        console.error('[VideoProvider Effect] Failed to initialize Stream Video Client:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || 'Video client initialization failed');
        setVideoClient(null);
      } finally {
        console.log("[VideoProvider Effect] Setting isConnecting to false.");
        setIsConnecting(false);
      }
    };

    initializeVideo();

    // --- Cleanup Function ---
    return () => {
      console.log('[VideoProvider Cleanup] Cleaning up Stream Video client...');
      // Use the instance captured in the effect's scope for potential cleanup if needed in future
      // Disconnect happens automatically when StreamVideo unmounts or client is replaced.
      // No explicit disconnect needed here.
      // clientInstance?.disconnect().catch((err: unknown) => console.error("Error disconnecting video client on cleanup:", err));
      // Reset state on cleanup related to this effect instance
      // setVideoClient(null); // Avoid resetting if a new client is being set up due to dependency change
      // setIsConnecting(false);
      // setError(null);
    };
    // Depend on chat connection status and loggedInUser username
    // Only re-run when chat connection or user changes. Internal state changes shouldn't trigger it.
  }, [connectionStatus, loggedInUser?.username, dispatch]);

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <AccessibleTypography sx={{ ml: 2 }}>Connecting Video...</AccessibleTypography>
      </Box>
    );
  }

    // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <AccessibleTypography color="error">Error connecting video: {error}</AccessibleTypography>
      </Box>
    );
  }

  // Render the Stream Video Provider only when the client is initialized.
  if (videoClient) {
    return (
      <StreamVideo client={videoClient}>
        {children}
      </StreamVideo>
    );
  }

  // If we reach here, it means:
  // - Not connecting (isConnecting is false)
  // - No error occurred
  // - videoClient is still null (likely waiting for chat connection)
  // Render a clear loading state instead of children to prevent premature rendering.
  return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <AccessibleTypography sx={{ ml: 2 }}>Initializing Video Service...</AccessibleTypography>
      </Box>
  );
};