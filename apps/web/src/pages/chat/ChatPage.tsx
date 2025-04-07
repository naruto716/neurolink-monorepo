import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, TextField, InputAdornment, IconButton } from '@mui/material'; // Added IconButton
import SearchIcon from '@mui/icons-material/Search'; // Keep SearchIcon for TextField
// Import Phosphor icons
import { VideoCamera, Phone } from '@phosphor-icons/react';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChatContext, // Import context hook
  useChannelStateContext // Import channel context hook
} from 'stream-chat-react';
import { EmojiPicker } from 'stream-chat-react/emojis'; // Import EmojiPicker
import type { ChannelSort, ChannelFilters } from 'stream-chat'; // Import types from base package
import {
  Call,
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  useStreamVideoClient, // Hook to get video client
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'; // Import Video SDK components

// Import Video SDK CSS
import '@stream-io/video-react-sdk/dist/css/styles.css';
// Import Stream Chat CSS v2
import 'stream-chat-react/dist/css/v2/index.css';

import { AccessibleTypography } from '../../app/components/AccessibleTypography';

const ChatPage: React.FC = () => {
  // Removed unused t variable from useTranslation
  const { client: chatClient } = useChatContext(); // Get chat client from context, rename
  const videoClient = useStreamVideoClient(); // Get video client from context
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  // State for the active call, storing both the call object and its type
  const [activeCallInfo, setActiveCallInfo] = useState<{ call: Call; type: 'video' | 'voice' } | null>(null);

  // Define filters only when the client and userID are definitely available
  const filters: ChannelFilters | undefined = useMemo(() => {
    if (chatClient?.userID) {
      const baseFilters = { type: 'messaging', members: { $in: [chatClient.userID] } };
      if (searchTerm) {
        // Combine base filter with name autocomplete search
        return { ...baseFilters, name: { $autocomplete: searchTerm } };
      }
      return baseFilters; // Return only base filters if no search term
    }
    return undefined;
  }, [chatClient?.userID, searchTerm]); // Recalculate when userID or searchTerm changes

  // Define sort using the correct type and value (-1 for descending)
  const sort: ChannelSort = useMemo(() => ({ last_message_at: -1 }), []); // Memoize sort object

  // Show loading state if filters are not ready yet (client or userID is missing)
  // Loading state: Wait for chat filters AND video client to be ready
  // Note: The parent ChatProvider already shows a loading indicator until clients are ready,
  // but we add this check for filters specifically.
  if (!filters || !videoClient) {
    return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            {/* Use a generic loading message as providers handle specific loading states */}
            <AccessibleTypography sx={{ ml: 2 }}>Loading...</AccessibleTypography>
        </Box>
    );
  }

  // --- Custom Channel Header with Video Button ---
  const CustomChannelHeader = () => {
    const { channel } = useChannelStateContext(); // Get current channel context

    // Updated function to handle both video and voice calls
    const startCall = async (callType: 'video' | 'voice') => {
      if (!videoClient || !channel?.id) {
        console.error("Video client or channel not available");
        return;
      }
      try {
        console.log(`Attempting to join/create ${callType} call: ${channel.id}`);
        const call = videoClient.call('default', channel.id);
        await call.join({ create: true });
        console.log(`Call ${channel.id} joined/created successfully.`);

        // Disable camera immediately if it's a voice call
        if (callType === 'voice') {
          console.log('Disabling camera for voice call.');
          await call.camera.disable();
          // Optionally disable microphone too if needed initially, though usually controlled by user
          // await call.microphone.disable();
        } else {
          // Ensure camera is enabled for video calls (might be disabled from previous voice call)
          console.log('Ensuring camera is enabled for video call.');
          await call.camera.enable();
        }

        setActiveCallInfo({ call: call, type: callType }); // Store call object and type
      } catch (error) {
        console.error(`Failed to start/join ${callType} call:`, error);
      }
    };

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ flexGrow: 1 }}><ChannelHeader /></Box>
        {/* Voice Call Button */}
        <IconButton onClick={() => startCall('voice')} color="primary" aria-label="start voice call" disabled={!videoClient || !channel} sx={{ mr: 1 }}>
          <Phone size={24} /> {/* Use Phosphor Phone icon */}
        </IconButton>
        {/* Video Call Button */}
        <IconButton onClick={() => startCall('video')} color="primary" aria-label="start video call" disabled={!videoClient || !channel}>
          <VideoCamera size={24} /> {/* Use Phosphor VideoCamera icon */}
        </IconButton>
      </Box>
    );
  };

  // --- Video Call UI Component ---
  const VideoCallUI = () => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    // Show loading indicator while joining
    if (callingState !== CallingState.JOINED) {
      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
          <AccessibleTypography sx={{ ml: 2 }}>Joining Call...</AccessibleTypography>
        </Box>
      );
    }

    // Render the main call UI once joined
    return (
      <StreamTheme style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <SpeakerLayout participantsBarPosition='bottom' />
        <CallControls onLeave={() => setActiveCallInfo(null)} /> {/* Leave button resets activeCallInfo */}
      </StreamTheme>
    );
  };

  // --- Main Render Logic ---
  return (
    // Restore the outer Box with calculated height (assuming 64px for header/navbar)
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Inner Box takes remaining space */}
      <Box sx={{ height: '100%', display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
      {/* Channel List */}
      <Box sx={{ width: '360px', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', padding: 3, '& .str-chat__channel-list': { borderRight: 'none' } }}>
        <TextField
          fullWidth
          placeholder="Search Channels"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(28, 28, 28, 0.05)' : 'rgba(255, 255, 255, 0.08)', border: 'none', '& fieldset': { border: 'none' }, '&.Mui-focused fieldset': { border: '1px solid', borderColor: 'primary.main' } } }}
        />
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <ChannelList filters={filters} sort={sort} />
        </Box>
      </Box>

      {/* Channel View Container */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, '& .str-chat__thread': { display: 'flex', flexDirection: 'column', height: '100%', '& .str-chat__main-panel-inner': { flexGrow: 1, minHeight: 0, overflowY: 'auto' } } }}>
        <Channel EmojiPicker={EmojiPicker}>
          {/* Conditionally render Video UI or Chat UI */}
          {activeCallInfo ? (
            // Render Video Call UI if a call is active (pass type if needed by UI)
            <StreamCall call={activeCallInfo.call}>
              {/* Pass call type if VideoCallUI needs to adapt */}
              <VideoCallUI /* callType={activeCallInfo.type} */ />
            </StreamCall>
          ) : (
            // Render Chat UI if no call is active
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', minHeight: 0, m: 3, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
              <Window>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 1 }}>
                  {/* Use the custom header with video button */}
                  <CustomChannelHeader />
                </Box>
                <MessageList />
                <Box sx={{ m: 2 }}>
                  <MessageInput />
                </Box>
              </Window>
              <Thread />
            </Box>
          )}
        </Channel>
      </Box>
      </Box>
    </Box>
  );
};

export default ChatPage;
