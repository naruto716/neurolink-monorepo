import React, { useMemo, useState } from 'react'; // Import useMemo, useState
import { Box, CircularProgress, TextField, InputAdornment } from '@mui/material'; // Import CircularProgress, TextField, InputAdornment
import SearchIcon from '@mui/icons-material/Search'; // Import SearchIcon
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
import { AccessibleTypography } from '../../app/components/AccessibleTypography';

const ChatPage: React.FC = () => {
  // Removed unused t variable from useTranslation
  const { client } = useChatContext(); // Get client from context
  const [searchTerm, setSearchTerm] = useState(''); // State for search input

  // Define filters only when the client and userID are definitely available
  const filters: ChannelFilters | undefined = useMemo(() => {
    if (client?.userID) {
      const baseFilters = { type: 'messaging', members: { $in: [client.userID] } };
      if (searchTerm) {
        // Combine base filter with name autocomplete search
        return { ...baseFilters, name: { $autocomplete: searchTerm } };
      }
      return baseFilters; // Return only base filters if no search term
    }
    return undefined;
  }, [client?.userID, searchTerm]); // Recalculate when userID or searchTerm changes

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

        {/* Channel List Container - Apply theme-aware styles */}
        <Box sx={{
          width: '360px', // Keep wider width
          flexShrink: 0,
          height: '100%', // Ensure Box takes full height
          display: 'flex',
          flexDirection: 'column',
          padding: 3,
          // Target the Stream Chat component's class to remove its border
          '& .str-chat__channel-list': {
            borderRight: 'none',
          },
        }}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search Channels"
            variant="outlined"
            size="small"
            value={searchTerm} // Bind value to state
            onChange={(e) => setSearchTerm(e.target.value)} // Update state on change
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2, // Add margin below the search bar
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px', // Match button/card radius
                backgroundColor: (theme) => theme.palette.mode === 'light' 
                  ? 'rgba(28, 28, 28, 0.05)' // black-5 like text button bg
                  : 'rgba(255, 255, 255, 0.08)', // white-8 like text button bg
                border: 'none', // Remove default border
                '& fieldset': {
                   border: 'none', // Remove fieldset border specifically
                },
                '&.Mui-focused fieldset': { // Add border only when focused
                  border: '1px solid',
                  borderColor: 'primary.main',
                },
                // Hover effect TBD if needed
              },
            }}
          />
          {/* Removed ChannelListHeader usage */}
          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}> {/* Wrapper for ChannelList to allow scrolling */}
            {filters ? (
              <ChannelList filters={filters} sort={sort} />
            ) : (
              <Box sx={{ p: 2, color: 'text.secondary' }}>Loading channels...</Box> // Use theme text color
            )}
          </Box>
        </Box>

        {/* Channel View Container - Apply theme-aware styles */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          <Channel>
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
