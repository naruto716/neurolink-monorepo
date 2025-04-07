import React, { useMemo } from 'react'; // Import useMemo
import { Box, CircularProgress } from '@mui/material'; // Import CircularProgress
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChatContext // Import context hook
} from 'stream-chat-react';
import type { ChannelSort, ChannelFilters } from 'stream-chat'; // Import types from base package
import 'stream-chat-react/dist/css/v2/index.css'; // Stream CSS v2
// Removed unused useTranslation import
import { AccessibleTypography } from '../../app/components/AccessibleTypography'; // Keep for title

// Removed style objects, will apply styles directly using sx prop

const ChatPage: React.FC = () => {
  // Removed unused t variable from useTranslation
  const { client } = useChatContext(); // Get client from context

  // Define filters only when the client and userID are definitely available
  const filters: ChannelFilters | undefined = useMemo(() => {
    if (client?.userID) {
      return { type: 'messaging', members: { $in: [client.userID] } };
    }
    return undefined;
  }, [client?.userID]); // Recalculate only when userID changes

  // Define sort using the correct type and value (-1 for descending)
  const sort: ChannelSort = useMemo(() => ({ last_message_at: -1 }), []); // Memoize sort object

  // Show loading state if filters are not ready yet (client or userID is missing)
  if (!filters) {
    return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <AccessibleTypography sx={{ ml: 2 }}>Loading Chat...</AccessibleTypography>
        </Box>
    );
  }

  // Render chat UI only when client and filters are ready
  return (
    // Use calculated height for the outermost container (adjust 64px if needed)
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Removed Chat title */}

      {/* Main Chat Layout */}
      {/* Use flex: 1 and overflow: 'hidden' */}
      <Box sx={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>

        {/* Channel List Container */}
        {/* Remove height, add overflowY: 'auto' */}
        <Box sx={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
          {filters ? (
            <ChannelList filters={filters} sort={sort} />
          ) : (
            <Box sx={{ p: 2 }}>Loading channels...</Box>
          )}
        </Box>

        {/* Channel View Container */}
        {/* Remove height, keep flex column */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Removed style prop from Channel */}
          <Channel>
            {/* Window component should handle its internal scrolling */}
            <Window>
              <ChannelHeader />
              <MessageList /> {/* Closing tag was missing */}
              <MessageInput />
            </Window>
            <Thread /> {/* Thread appears alongside/over Window */}
          </Channel> {/* Moved closing tag here */}
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPage;
