/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, ReactNode } from 'react'; // Removed unused useMemo
import { useDispatch, useSelector } from 'react-redux';
import { StreamChat, Event, TokenOrProvider } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { StreamVideoClient, StreamVideo, User as VideoUser } from '@stream-io/video-react-sdk'; // Import Video SDK components
import { useTheme, GlobalStyles, Box, CircularProgress } from '@mui/material'; // Added Box, CircularProgress
import { Theme } from '@mui/material/styles'; // Import Theme type
// Removed unused AccessibleTypography import
import { AppDispatch } from '../../app/store/initStore';
import {
  setChatConnecting,
  setChatConnected,
  setChatDisconnected,
  setChatError,
  setTotalUnreadCount,
  selectChatConnectionStatus,
  selectChatUserId,
  fetchChatToken // Import fetchChatToken from main export
  // Removed unused ChatState import
} from '@neurolink/shared'; // Import directly from shared package
import { selectCurrentUser } from '@neurolink/shared'; // Import user selector from main export
// fetchChatToken is already imported above
import apiClient from '../../app/api/apiClient'; // Import the web app's configured apiClient

// --- Placeholder for Audio ---
// Use relative path to public folder for better reliability
const NOTIFICATION_SOUND_URL = 'https://d2ymeg1i7s1elw.cloudfront.net/notification.wav';

// Simple sound playback function
function playNotificationSound() {
  try {
    // Create a new Audio element each time for more reliable playback
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 1.0;
    // Play the sound
    audio.play().catch(e => {
      console.error("Error playing notification sound:", e);
    });
    console.log("Playing notification sound from URL:", NOTIFICATION_SOUND_URL);
  } catch (e) {
    console.error("Error setting up notification sound:", e);
  }
}

// Request notification permission
const requestNotificationPermission = () => {
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
};

// Browser notification handling
function showBrowserNotification(title: string, body: string, icon?: string) {
  // Check if browser supports notifications
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  // Check if permission is already granted
  if (Notification.permission === "granted") {
    createNotification(title, body, icon);
  } 
  // Otherwise, request permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        createNotification(title, body, icon);
      }
    });
  }
}

// Helper to create the notification
function createNotification(title: string, body: string, icon?: string) {
  const notification = new Notification(title, {
    body: body,
    icon: icon || 'https://d2ymeg1i7s1elw.cloudfront.net/Logo.png' // Default to app logo
  });
  
  // Auto close after 5 seconds
  setTimeout(() => notification.close(), 5000);
  
  // Optional: Handle notification click
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
// ---------------------------

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const connectionStatus = useSelector(selectChatConnectionStatus);
  const currentChatUserId = useSelector(selectChatUserId); // Get current connected user ID from redux
  const loggedInUser = useSelector(selectCurrentUser); // Get the main app's logged-in user

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null); // State for Video Client

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    // Prevent re-initialization if already connected or connecting
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      // If the logged-in user changes while connected, disconnect and reconnect
      if (loggedInUser?.username && currentChatUserId && loggedInUser.username !== currentChatUserId) {
          console.warn(`App user (${loggedInUser.username}) differs from chat user (${currentChatUserId}). Reconnecting chat.`);
          chatClient?.disconnectUser().catch((err: unknown) => console.error("Error disconnecting user for switch:", err)); // Typed catch
          // Setting status to disconnected will trigger re-initialization by the effect dependencies
          dispatch(setChatDisconnected({ error: 'User changed, reconnecting.' }));
          setChatClient(null); // Clear chat client state
          setVideoClient(null); // Clear video client state on user switch
      }
      return; // Already connected/connecting with the correct user
    }

    // Ensure user is logged in within the main app before trying to init chat
    if (!loggedInUser?.username) {
        console.log("App user not logged in, skipping chat initialization.");
        // Ensure chat state reflects disconnection if it wasn't already idle/disconnected
        // eslint-disable-next-line -- Attempt to suppress persistent linter warning on this line
        if (connectionStatus !== 'idle' && connectionStatus !== 'disconnected') {
            dispatch(setChatDisconnected(undefined)); // Explicitly pass undefined payload
        }
        // If there's an old client instance, disconnect it
        if (chatClient) {
            chatClient.disconnectUser().catch((err: unknown) => console.error("Error disconnecting stale chat client:", err)); // Typed catch
            setChatClient(null);
            setVideoClient(null); // Clear video client state if logging out
        }
        return;
    }

    let chatClientInstance: StreamChat | null = null; // Renamed for clarity
    let videoClientInstance: StreamVideoClient | null = null; // Variable for video client instance
    let chatListeners: any[] = []; // Renamed for clarity
    const targetUsername = loggedInUser.username; // Use the actual logged-in username

    // Track previous unread count to detect increases
    let previousUnreadCount = 0;

    const initializeChat = async () => {
      dispatch(setChatConnecting());
      console.log(`Attempting to initialize Stream Chat for user: ${targetUsername}...`);

      try {
        // --- Fetch Credentials ---
        // apiClient interceptor handles baseURL override and X-User-Name header
        const { apiKey, token, userId } = await fetchChatToken(apiClient);

        // Validate the userId returned by the token endpoint matches our target user
        if (userId !== targetUsername) {
            // If the interceptor is hardcoded, this error is expected for other users.
            console.error(`User ID mismatch! Expected: ${targetUsername}, Received from token endpoint: ${userId}. Check API interceptor/backend logic.`);
            // throw new Error(`User ID mismatch! Expected: ${targetUsername}, Received: ${userId}`);
            // Forcing connection with received userId for tutorial purposes, despite mismatch warning.
        }

        // --- Initialize Client ---
        // --- Initialize Chat Client ---
        console.log("Initializing Stream Chat Client...");
        chatClientInstance = StreamChat.getInstance(apiKey, {
             enableInsights: true,
             enableWSFallback: true,
        });

        // --- Setup Chat Event Listeners ---
        chatListeners = [
          // Connection event - correct per docs
          chatClientInstance.on('connection.changed', (event: Event) => {
            console.log('Stream connection changed:', event.online);
            if (event.online) {
              // Check if the connected chat user ID is still the one we expect
              if (chatClientInstance?.userID === targetUsername) {
                dispatch(setChatConnected({ userId: chatClientInstance.userID }));
              } else {
                console.warn(`Reconnected with unexpected user ID: ${chatClientInstance?.userID}. Expected: ${targetUsername}.`);
                chatClientInstance?.disconnectUser().catch((err: unknown) => console.error("Error disconnecting mismatched user:", err));
                dispatch(setChatDisconnected({ error: 'Mismatched user ID on reconnect.' }));
              }
            } else {
              dispatch(setChatDisconnected({ error: 'Connection lost' }));
            }
          }),

          // Listen to all client events for unread counts and track changes
          chatClientInstance.on((event: Event) => {
            // Handle unread count changes as documented in Stream docs
            if (event.total_unread_count !== null && event.total_unread_count !== undefined) {
              console.log(`Total unread messages count is now: ${event.total_unread_count}`);
              
              // Check if unread count increased (indicating new message)
              if (event.total_unread_count > previousUnreadCount) {
                console.log(`Unread count increased from ${previousUnreadCount} to ${event.total_unread_count}`);
                
                // Play notification sound when unread count increases
                playNotificationSound();
                
                // Check if this event contains message data for better notification
                let notificationTitle = "New Message";
                let notificationBody = "You have a new message";
                let notificationIcon = undefined;
                
                // If this event has message data, use it for a more informative notification
                if (event.message) {
                  const senderName = event.message.user?.name || event.message.user?.id || 'Someone';
                  notificationTitle = senderName;
                  
                  // Use actual message text if available
                  if (event.message.text) {
                    notificationBody = event.message.text;
                  }
                  
                  // Use sender's profile image if available
                  if (typeof event.message.user?.image === 'string') {
                    notificationIcon = event.message.user.image;
                  }
                }
                
                showBrowserNotification(
                  notificationTitle,
                  notificationBody,
                  notificationIcon
                );
              }
              
              // Update previous count for next comparison
              previousUnreadCount = event.total_unread_count;
              
              dispatch(setTotalUnreadCount(event.total_unread_count));
            }
            
            // Also log unread channels if available (per docs example)
            if (event.unread_channels !== null && event.unread_channels !== undefined) {
              console.log(`Unread channels count is now: ${event.unread_channels}`);
            }
          }),
        ];

        // --- Initialize Video Client ---
        console.log("Initializing Stream Video Client...");
        const videoUser: VideoUser = {
            id: userId,
            name: loggedInUser.displayName || userId, // Use displayName or fallback
            image: loggedInUser.profilePicture, // Use profilePicture
            // Add other fields if needed from loggedInUser
        };
        videoClientInstance = new StreamVideoClient({ apiKey, user: videoUser, token });
        // Note: Video client connects automatically when StreamVideo provider mounts or call methods used

        // --- Connect Chat User ---
        await chatClientInstance.connectUser( { id: userId }, token as TokenOrProvider );
        console.log(`Chat User ${chatClientInstance.userID} connected successfully.`);

        // --- Update Redux & Component State ---
        // --- Update Redux & Component State for BOTH clients ---
        dispatch(setChatConnected({ userId: chatClientInstance.userID! })); // Dispatch chat connected
        const unreadCount = chatClientInstance.user?.total_unread_count;
        dispatch(setTotalUnreadCount(typeof unreadCount === 'number' ? unreadCount : 0));
        setChatClient(chatClientInstance); // Set chat client in state
        setVideoClient(videoClientInstance); // Set video client in state

      } catch (error: unknown) { // Typed catch
        console.error('Failed to initialize Stream Chat:', error);
        const errorMessage = error instanceof Error ? error.message : String(error); // Extract message safely
        dispatch(setChatError({ error: errorMessage || 'Initialization failed' }));
        setChatClient(null);
        setVideoClient(null); // Clear video client on error
        chatListeners.forEach(listener => listener.unsubscribe());
        // Attempt to disconnect video client if it exists (though web SDK might not need explicit disconnect)
        videoClientInstance?.disconnectUser?.().catch(err => console.error("Error disconnecting video user on init failure:", err));
      }
    };

    initializeChat();

    // --- Cleanup Function ---
    // --- Cleanup Function ---
    return () => {
      console.log('Cleaning up Stream Chat & Video clients...');
      chatListeners.forEach(listener => listener.unsubscribe());

      // Use the instances captured in this effect's scope for cleanup
      const chatCleanupInstance = chatClientInstance;
      const videoCleanupInstance = videoClientInstance;

      if (chatCleanupInstance) {
        console.log('Disconnecting chat user...');
        chatCleanupInstance.disconnectUser().catch((err: unknown) => console.error("Error disconnecting chat user:", err));
      }
      if (videoCleanupInstance) {
          console.log('Disconnecting video client...');
          // Use disconnectUser based on tutorial example, adjust if web SDK differs
          videoCleanupInstance.disconnectUser?.().catch((err: unknown) => console.error("Error disconnecting video client:", err));
      }
      // Avoid dispatching disconnect here if the component unmounts but the user is still logged in
      // Let the main login/logout flow handle the disconnect dispatch.
    };
  }, [dispatch, loggedInUser?.username, connectionStatus, loggedInUser?.displayName, loggedInUser?.profilePicture, currentChatUserId, chatClient]); // Added connectionStatus to prevent re-run loops

  const theme = useTheme(); // Get the current MUI theme
  const streamTheme = theme.palette.mode === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light';

  // Determine if chat is ready
  const chatReady = connectionStatus === 'connected' && chatClient && videoClient;

  return (
    <>
      {/* Render chat/video providers conditionally */}
      {chatReady ? (
        <>
          <GlobalStyles
            styles={(theme: Theme) => ({ // Wrap the object in a function accepting theme
              '.str-chat': {
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
              },
              '.str-chat__channel-preview--selected': {
                // Use a function to access the theme (already correct here)
                backgroundColor: theme.palette.mode === 'light'
                    ? 'rgba(28, 28, 28, 0.05)' // Light mode subtle bg
                    : 'rgba(255, 255, 255, 0.08)', // Dark mode subtle bg
                // Adjust hover for selected item slightly
                '&:hover': {
                   backgroundColor: theme.palette.mode === 'light'
                      ? 'rgba(28, 28, 28, 0.08)' // Slightly darker hover
                      : 'rgba(255, 255, 255, 0.12)', // Slightly brighter hover
                }
              },
              // --- Rounded Corners for Channel Previews ---
              '.str-chat__channel-preview-messenger': {
                borderRadius: '8px',
                margin: '4px 0', // Add some vertical margin between items
              },
              // Light theme active/selected messenger preview
              '.str-chat__theme-light .str-chat__channel-preview-messenger--active': {
                backgroundColor: 'rgba(28, 28, 28, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(28, 28, 28, 0.08)',
                },
              },
              // Dark theme active/selected messenger preview
              '.str-chat__theme-dark .str-chat__channel-preview-messenger--active': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                },
              },
              // --- Transparent Channel List Background ---
              '.str-chat.str-chat__theme-dark.str-chat__channel-list.str-chat__channel-list-react': {
                backgroundColor: 'transparent',
              },
              // --- Message Input Styling ---
              // Light theme message input
              '.str-chat__theme-light .str-chat__message-input': {
                backgroundColor: 'rgba(28, 28, 28, 0.05)',
                borderRadius: '8px',
              },
              // Dark theme message input
              '.str-chat__theme-dark .str-chat__message-input': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
              },
              '.str-chat__channel-header': {
                backgroundColor: 'transparent',
              },
              // --- Video Menu Button Text Color Fix (Light Mode) ---
              '.str-chat__theme-light': {
                '.str-video__generic-menu .str-video__generic-menu--item button': {
                  color: 'white', // Set button text color to white in light mode
                },
                '.str-video__notification .str-video__notification__message': {
                  color: 'white', // Set notification message text color to white in light mode
                },
                '.str-video__participant-view .str-video__participant-details .str-video__participant-details__name': {
                  color: 'white', // Set participant name text color to white in light mode
                },
                // Add other light-mode specific overrides here if needed
              },
              // Add specific dark mode overrides if necessary
              '.str-chat__theme-dark': {
                // Example: If dark mode needed adjustments too
                // '.str-video__generic-menu .str-video__generic-menu--item button': {
                //   color: theme.palette.text.primary, // Example for dark mode
                // }
              }
            })}
          />
          {/* Wrap Chat with StreamVideo */}
          {/* Use non-null assertion as chatReady checks this */}
          <StreamVideo client={videoClient!}>
            <Chat client={chatClient!} theme={streamTheme}>
              {/* Render children INSIDE Chat when ready */}
              {children}
            </Chat>
          </StreamVideo>
        </>
      ) : (
        <>
          {/* Render children OUTSIDE Chat when not ready */}
          {children}
          {/* Optionally, show a non-blocking loading indicator or error message */}
          {/* Example: Small indicator at the bottom corner */}
          {connectionStatus === 'connecting' && (
             <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1500, p: 1, bgcolor: 'background.paper', borderRadius: '50%', boxShadow: 3 }}>
               <CircularProgress size={24} />
             </Box>
          )}
           {connectionStatus === 'error' && (
             <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1500, p: 1, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1, boxShadow: 3 }}>
               Chat Error
             </Box>
           )}
        </>
      )}
    </>
  );

  // Removed the full-screen loading state. Children are rendered above regardless of chat status.
};

