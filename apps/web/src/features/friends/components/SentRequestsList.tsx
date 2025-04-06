import {
    Alert,
    alpha,
    Avatar,
    Box,
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton, // Added ListItemButton for consistency
    ListItemSecondaryAction,
    ListItemText,
    Skeleton,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import {
    Connection,
    declineFriendRequest, // Re-use for cancelling
    fetchSentRequests, // Use the new fetch function
    PaginatedConnectionsResponse,
} from '@neurolink/shared';
import {
    XCircle as XCircleIcon
} from '@phosphor-icons/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../app/api/apiClient';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';

const REQUESTS_PER_PAGE = 10;

interface SentRequestsListProps {
  username: string; // Logged-in user's username (to fetch *their* initiated requests)
  onNavigate?: () => void; // Optional callback for navigation (e.g., close modal)
}

// Skeleton Loader Component (similar to Pending)
const SentRequestSkeleton = () => {
  return (
    <ListItem divider sx={{ py: 1.5, opacity: 0.7 }}>
      <ListItemAvatar sx={{ mt: 0.5 }}>
        <Skeleton variant="circular" width={40} height={40} />
      </ListItemAvatar>
      <ListItemText
        primary={<Skeleton variant="text" width="40%" height={20} />}
        secondary={<Skeleton variant="text" width="30%" height={18} />}
      />
      <ListItemSecondaryAction>
        <Skeleton variant="circular" width={32} height={32} />
      </ListItemSecondaryAction>
    </ListItem>
  );
};


const SentRequestsList: React.FC<SentRequestsListProps> = ({ username, onNavigate }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // --- State for Infinite Scrolling ---
  const [requests, setRequests] = useState<Connection[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<number | null>(null); // Track cancelling state
  const isLoadingMore = useRef(false);
  const isNewFetch = useRef(true);
  const observer = useRef<IntersectionObserver | null>(null);
  // --- End State ---

  // Function to trigger fetching requests
  const triggerFetch = useCallback(async (page: number, isNew: boolean = false) => {
    if (!username) {
      setStatus('failed');
      setError(t('friendsPage.error.missingUsername', 'Username is missing.'));
      return;
    }
    if (isLoadingMore.current && !isNew) return;
    if (!isNew && currentPage >= totalPages && totalPages > 0) return;

    setStatus('loading');
    setError(null);

    if (isNew) {
      isNewFetch.current = true;
      setRequests([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalRequests(0);
    } else {
      isLoadingMore.current = true;
    }

    try {
      const data: PaginatedConnectionsResponse = await fetchSentRequests(apiClient, username, {
        page: page,
        limit: REQUESTS_PER_PAGE,
      });

      setRequests((prev) => {
        if (isNewFetch.current) return data.connections ?? [];
        const existingIds = new Set(prev.map((r) => r.friendId));
        const newUniqueRequests = (data.connections ?? []).filter(
          (r) => !existingIds.has(r.friendId)
        );
        return [...prev, ...newUniqueRequests];
      });

      setCurrentPage(data.page ?? page);
      setTotalPages(Math.ceil((data.totalConnections ?? 0) / (data.limit ?? REQUESTS_PER_PAGE)));
      setTotalRequests(data.totalConnections ?? 0);
      setStatus('succeeded');
    } catch (err) {
      console.error(`Failed to fetch sent requests page ${page} for ${username}:`, err);
      const message = err instanceof Error ? err.message : t('friendsPage.error.sentLoad', 'Failed to load sent requests.');
      setError(message);
      setStatus('failed');
    } finally {
      isLoadingMore.current = false;
      isNewFetch.current = false;
      if (status === 'loading' && !error) {
          setStatus(requests.length > 0 || totalRequests > 0 ? 'succeeded' : 'idle');
      }
    }
  }, [username, t, status, error, requests.length, totalRequests, currentPage, totalPages]); // Added deps

  // Last element ref callback for infinite scroll
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (status === 'succeeded') { 
        observer.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !isLoadingMore.current && currentPage < totalPages) {
              triggerFetch(currentPage + 1);
            }
          },
          { threshold: 0.8 }
        );
        if (node) observer.current.observe(node);
    }
  }, [currentPage, totalPages, status, triggerFetch]); // Removed isLoadingMore from deps

  // Initial data fetch
  useEffect(() => {
    if (status === 'idle') {
      triggerFetch(1, true);
    }
  }, [triggerFetch, status]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  // --- Action Handlers ---
  const handleCancelRequest = async (otherUsername: string, friendId: number) => {
    setCancellingRequestId(friendId);
    try {
      await declineFriendRequest(apiClient, otherUsername); // Use decline API
      toast.info(t('friendsPage.toast.requestCancelled', 'Friend request cancelled.'));
      setRequests((prev) => prev.filter((req) => req.friendId !== friendId));
      setTotalRequests(prev => prev - 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('friendsPage.error.cancelFailed', 'Failed to cancel request.');
      toast.error(message);
      console.error(`Error cancelling request to ${otherUsername}:`, err);
    } finally {
      setCancellingRequestId(null);
    }
  };

  // --- Render Logic ---
  return (
    <Box sx={{ width: '100%' }}>
      {/* Initial Loading Skeleton */} 
      {status === 'loading' && requests.length === 0 && (
        <List dense sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {[...Array(3)].map((_, index) => <SentRequestSkeleton key={`skeleton-${index}`} />)}
        </List>
      )}

      {/* Error Display */} 
      {status === 'failed' && !isLoadingMore.current && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {/* No Sent Requests */} 
      {status === 'succeeded' && requests.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <AccessibleTypography color="text.secondary">
            {t('friendsPage.noSent', 'No pending sent requests.')}
          </AccessibleTypography>
        </Box>
      )}

      {/* Sent Requests List */} 
      {requests.length > 0 && (
        <List dense sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {requests.map((request, index) => {
            const isCancelling = cancellingRequestId === request.friendId;
            const attachObserver = requests.length >= 4 ? index === requests.length - 4 : index === 0;
            
            return isCancelling ? (
                 <ListItem key={request.friendId} divider sx={{ py: 1.5, opacity: 0.6 }}>
                    <ListItemAvatar sx={{ mt: 0.5 }}>
                       <Avatar src={request.profilePicture || undefined} alt={request.displayName} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={request.displayName}
                      secondary={`@${request.username}`}
                    />
                    <ListItemSecondaryAction>
                       <CircularProgress size={24} />
                    </ListItemSecondaryAction>
                 </ListItem>
            ) : (
              <ListItemButton
                key={request.friendId}
                divider
                ref={attachObserver ? lastElementRef : undefined}
                sx={{ py: 1.5 }}
                component={RouterLink}
                to={`/people/${request.username}`}
                onClick={() => {
                    if (onNavigate) onNavigate();
                }}
              >
                <ListItemAvatar sx={{ mt: 0.5 }}>
                  <Avatar src={request.profilePicture || undefined} alt={request.displayName} />
                </ListItemAvatar>
                <ListItemText
                  primary={request.displayName}
                  secondary={`@${request.username}`}
                />
                <ListItemSecondaryAction>
                    <Tooltip title={t('friends.buttons.cancel', 'Cancel Request') as string}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                             e.preventDefault(); // Prevent navigation
                             e.stopPropagation();
                             handleCancelRequest(request.username, request.friendId);
                          }}
                          sx={{
                            color: theme.palette.warning.dark, // Use warning color
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                            },
                          }}
                        >
                          <XCircleIcon size={20} />
                        </IconButton>
                    </Tooltip>
                </ListItemSecondaryAction>
              </ListItemButton>
            );
          })}
        </List>
      )}

      {/* Loading More Skeleton */} 
      {status === 'loading' && requests.length > 0 && (
         <List dense sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            <SentRequestSkeleton />
         </List>
      )}

      {/* End of Results */} 
      {status === 'succeeded' && currentPage >= totalPages && totalRequests > 0 && requests.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t('people.endOfResults', "You've reached the end of the results")}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SentRequestsList; 