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
import { useTranslation } from 'react-i18next'; // Keep i18n if needed for other text
import { AccessibleTypography } from '../../app/components/AccessibleTypography'; // Keep for title

// Basic CSS for layout (consider moving to a dedicated CSS file or using MUI Grid/Stack)
const chatContainerStyle = {
  display: 'flex',
  height: 'calc(100vh - 120px)', // Example height, adjust based on your layout (navbar, etc.)
  width: '100%',
};

const channelListContainerStyle = {
  width: '300px', // Adjust width as needed
  borderRight: '1px solid #e0e0e0', // Example border
  display: 'flex',
  flexDirection: 'column',
};

const channelContainerStyle = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
};
// ---

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
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
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Keep page title if desired */}
      <AccessibleTypography variant="h4" gutterBottom>
        {t('chat.title')}
      </AccessibleTypography>

      {/* Main Chat Layout */}
      <Box sx={chatContainerStyle}>
        <Box sx={channelListContainerStyle}>
          {filters ? ( // Only render ChannelList if filters are ready
            <ChannelList
              filters={filters}
              sort={sort}
              // You might add options like Paginator, Preview, etc. here
            />
          ) : (
            <Box sx={{ p: 2 }}>Loading channels...</Box> // Placeholder while client initializes
          )}
        </Box>
        <Box sx={channelContainerStyle}>
          <Channel> {/* Renders the currently active channel from context */}
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPage;
