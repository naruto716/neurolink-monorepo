// apps/web/src/features/friends/components/FriendList.tsx
import {
  Alert,
  Avatar,
  Box,
  List, // Re-added List
  ListItemAvatar, // Re-added ListItemAvatar
  ListItemButton, // Re-added ListItemButton
  ListItemText,
  Skeleton, // Re-added ListItemText
  // Stack, // Removed unused import
  Tab, // Added Tab
  Tabs, // Added Tabs
  Typography
} from '@mui/material';
import { PaginatedUsersResponse, User, fetchUserFriends, selectCurrentUser } from '@neurolink/shared';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux'; // Import useSelector
import { Link as RouterLink } from 'react-router-dom'; // Keep RouterLink for list items
import { toast } from 'react-toastify';
import apiClient from '../../../app/api/apiClient'; // Adjusted path
import { AccessibleTypography } from '../../../app/components/AccessibleTypography'; // Adjusted path
import PendingRequestsList from './PendingRequestsList'; // Import the new component
import SentRequestsList from './SentRequestsList'; // Import the SentRequestsList component

const FRIENDS_PER_PAGE = 10; // Increased limit slightly

interface FriendListProps {
  username: string; // Accept username as a prop
  onNavigate?: () => void; // Add optional callback for navigation
}

// TabPanel helper component (can be moved to a shared location later)
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friend-tabpanel-${index}`}
      aria-labelledby={`friend-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `friend-tab-${index}`,
    'aria-controls': `friend-tabpanel-${index}`,
  };
}


const FriendList: React.FC<FriendListProps> = ({ username, onNavigate }) => {
  const { t } = useTranslation();
  const currentUser = useSelector(selectCurrentUser); // Get current user from Redux
  const isCurrentUserProfile = currentUser?.username === username; // Check if it's the current user's profile

  // Default active tab to 0 (Friends). Tabs only shown if isCurrentUserProfile is true.
  const [activeTab, setActiveTab] = useState(0);

  // --- State for Infinite Scrolling (Friends Tab) ---
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const isLoadingMore = useRef(false);
  const isNewFetch = useRef(true);
  const observer = useRef<IntersectionObserver | null>(null);
  // --- End State ---

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Only allow tab changes if it's the current user's profile
    if (!isCurrentUserProfile) return;

    setActiveTab(newValue);
    // Only reset the main status/error if switching TO the Friends tab
    if (newValue === 0) {
      setStatus('idle'); 
      setError(null); 
      setAllFriends([]); // Clear previous friends list data
      setCurrentPage(0);
      setTotalPages(0);
      isNewFetch.current = true;
      isLoadingMore.current = false;
    } else {
        // When switching to Pending/Sent, clear the friends list (optional, but clean)
        setAllFriends([]); 
        // Do NOT reset main status/error here, let PendingRequestsList handle its own state
    }
  };

  // Function to trigger fetching friends (for Friends tab)
  const triggerFriendFetch = useCallback(async (page: number, isNew: boolean = false) => {
    // --- Add stricter guards --- 
    if (isLoadingMore.current && !isNew) return; // Already guarded, but keep
    // Prevent fetching if already on the last page (unless it's a new fetch)
    if (!isNew && currentPage >= totalPages && totalPages > 0) return; 
    // --- End stricter guards ---

    // Fetch friends regardless of profile type, as friends tab/list is always shown
    if (!username) {
        setStatus('failed');
        setError(t('friendsPage.error.missingUsername', 'Username is missing.'));
        return;
    }
    if (isLoadingMore.current && !isNew) return;

    // Only set loading status if the friends list (tab 0 or only list) is active/relevant
    if (activeTab === 0 || !isCurrentUserProfile) { 
        setStatus('loading');
        setError(null);
    }

    if (isNew) {
        isNewFetch.current = true;
        setAllFriends([]);
        setCurrentPage(0);
        setTotalPages(0);
    } else {
        isLoadingMore.current = true;
    }

    try {
      const data: PaginatedUsersResponse = await fetchUserFriends(apiClient, username, { page: page, limit: FRIENDS_PER_PAGE });

      setAllFriends(prev => {
          if (isNewFetch.current) return data.users ?? [];
          const existingIds = new Set(prev.map(f => f.id));
          const newUniqueFriends = (data.users ?? []).filter(f => !existingIds.has(f.id));
          return [...prev, ...newUniqueFriends];
      });

      setCurrentPage(data.page ?? page);
      setTotalPages(Math.ceil((data.totalUsers ?? 0) / (data.limit ?? FRIENDS_PER_PAGE)));
      
      // Only set succeeded status if the friends list (tab 0 or only list) is active/relevant
      if (activeTab === 0 || !isCurrentUserProfile) {
        setStatus('succeeded');
      }

    } catch (err) {
      console.error(`Failed to fetch friends page ${page} for ${username}:`, err);
      const message = err instanceof Error ? err.message : t('friendsPage.error.genericLoad', 'Failed to load friends.');
      setError(message);
      // Only set failed status if the friends list (tab 0 or only list) is active/relevant
      if (activeTab === 0 || !isCurrentUserProfile) {
        setStatus('failed');
        toast.error(message);
      }
    } finally {
       isLoadingMore.current = false;
       isNewFetch.current = false;
       // Ensure status isn't stuck on loading for the friends list
       if ((activeTab === 0 || !isCurrentUserProfile) && status === 'loading') {
           if (!error) setStatus(allFriends.length > 0 ? 'succeeded' : 'idle');
       }
    }
  }, [username, t, status, error, allFriends.length, activeTab, isCurrentUserProfile, currentPage, totalPages]); // Added isCurrentUserProfile

  // Last friend element ref callback for infinite scroll (for Friends tab/list)
  const lastFriendElementRef = useCallback((node: HTMLElement | null) => {
    // Disconnect previous observer first
    if (observer.current) observer.current.disconnect(); 

    // Only attach observer if the previous fetch succeeded and it's the relevant view
    if ((!isCurrentUserProfile || activeTab === 0) && status === 'succeeded') { 
        observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && !isLoadingMore.current && currentPage < totalPages) {
            console.log('FriendList Observer triggered fetch'); // Debug log
            triggerFriendFetch(currentPage + 1);
          }
        }, { threshold: 0.8 });

        if (node) observer.current.observe(node);
    } 
    // No need for an else block to disconnect, already done at the start
  }, [currentPage, totalPages, status, triggerFriendFetch, activeTab, isCurrentUserProfile]); // Dependencies seem correct

  // Initial data fetch
  useEffect(() => {
    // Fetch friends only if Friends tab (0) is active and status is idle
    if (activeTab === 0 && status === 'idle') { 
        triggerFriendFetch(1, true);
    }
    // NOTE: Pending/Sent fetching is handled internally by PendingRequestsList/SentRequestsList
  }, [triggerFriendFetch, status, activeTab]); // Removed isCurrentUserProfile, check is inside now

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  // Helper component to render the friends list content (used in both scenarios)
  const renderFriendsList = () => (
    <>
      {status === 'loading' && allFriends.length === 0 && (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {[...Array(5)].map((_, index) => (
            <ListItemButton key={`skeleton-${index}`} divider sx={{ alignItems: 'flex-start', py: 1.5 }}>
              <ListItemAvatar sx={{ mt: 0.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
              </ListItemAvatar>
              <ListItemText
                primary={<Skeleton variant="text" width="40%" height={20} />}
                secondary={
                  <>
                    <Skeleton variant="text" width="30%" height={18} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="60%" height={14} />
                  </>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
      {status === 'failed' && !isLoadingMore.current && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      {allFriends.length > 0 ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {allFriends.map((friend, index) => {
            const attachObserver = allFriends.length >= 4
              ? index === allFriends.length - 4
              : index === 0;
            return (
              <ListItemButton
                key={friend.id}
                component={RouterLink}
                to={`/people/${friend.username}`}
                divider
                ref={attachObserver ? lastFriendElementRef : undefined}
                sx={{ alignItems: 'flex-start', py: 1.5 }}
                onClick={() => {
                  if (onNavigate) {
                    onNavigate();
                  }
                }}
              >
                <ListItemAvatar sx={{ mt: 0.5 }}>
                  <Avatar src={friend.profilePicture || undefined} alt={friend.displayName} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="medium">
                      {friend.displayName}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                        @{friend.username}
                      </Typography>
                      {friend.bio && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mt: 0.5
                          }}
                        >
                          {friend.bio}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      ) : status === 'succeeded' && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <AccessibleTypography color="text.secondary">
            {t('friendsPage.noFriends', 'No friends found.')}
          </AccessibleTypography>
        </Box>
      )}
      {/* Skeleton Loader for Loading More */} 
      {status === 'loading' && allFriends.length > 0 && (
        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          <ListItemButton divider sx={{ alignItems: 'flex-start', py: 1.5 }}>
            <ListItemAvatar sx={{ mt: 0.5 }}>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemAvatar>
            <ListItemText
              primary={<Skeleton variant="text" width="40%" height={20} />}
              secondary={
                <>
                  <Skeleton variant="text" width="30%" height={18} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="60%" height={14} />
                </>
              }
            />
          </ListItemButton>
        </List>
      )}
      {status === 'succeeded' && currentPage >= totalPages && allFriends.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t('people.endOfResults', "You've reached the end of the results")}
          </Typography>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Render Tabs only if it's the current user's profile */} 
      {isCurrentUserProfile && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="friend list tabs" variant="fullWidth">
            <Tab label={t('friends.tabs.friends', 'Friends')} {...a11yProps(0)} />
            <Tab label={t('friends.tabs.pending', 'Pending')} {...a11yProps(1)} />
            <Tab label={t('friends.tabs.sent', 'Sent')} {...a11yProps(2)} />
          </Tabs>
        </Box>
      )}

      {/* Conditionally render tab panels or just the friends list */} 
      {isCurrentUserProfile ? (
        <>
          {/* Friends Tab Content */} 
          <TabPanel value={activeTab} index={0}>
            {renderFriendsList()}
          </TabPanel>

          {/* Pending Tab Content */} 
          <TabPanel value={activeTab} index={1}>
            {activeTab === 1 && (
              <PendingRequestsList username={username} onNavigate={onNavigate} />
            )}
          </TabPanel>

          {/* Sent Tab Content */} 
          <TabPanel value={activeTab} index={2}>
             {/* Render SentRequestsList */} 
             {activeTab === 2 && (
                <SentRequestsList username={username} onNavigate={onNavigate} />
             )}
          </TabPanel>
        </>
      ) : (
        // If not current user's profile, render only the friends list directly
        <Box sx={{ pt: 2 }}> {/* Add padding similar to TabPanel */}
           {renderFriendsList()}
        </Box>
      )}
    </Box>
  );
};

export default FriendList;