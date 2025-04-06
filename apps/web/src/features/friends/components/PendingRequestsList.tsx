import {
  acceptFriendRequest,
  Connection,
  declineFriendRequest,
  fetchPendingRequests,
  PaginatedConnectionsResponse,
} from '@neurolink/shared';
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
  ListItemButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
} from '@phosphor-icons/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../app/api/apiClient';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';

const REQUESTS_PER_PAGE = 10;

interface PendingRequestsListProps {
  username: string; // Logged-in user's username (to fetch *their* received requests)
  onNavigate?: () => void; // Optional callback for navigation (e.g., close modal)
}

// Skeleton Loader Component for Pending Requests
const PendingRequestSkeleton = () => {
  return (
    <ListItem divider sx={{ py: 1.5, opacity: 0.7 }}>
      <ListItemAvatar sx={{ mt: 0.5 }}>
        <Skeleton variant="circular" width={40} height={40} />
      </ListItemAvatar>
      <ListItemText
        primary={<Skeleton variant="text" width="40%" height={20} />}
        secondary={<Skeleton variant="text" width="30%" height={18} />}
      />
      <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </ListItemSecondaryAction>
    </ListItem>
  );
};


const PendingRequestsList: React.FC<PendingRequestsListProps> = ({ username, onNavigate }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // --- State for Infinite Scrolling ---
  const [requests, setRequests] = useState<Connection[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null); // Track which request is being accepted/declined
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
      const data: PaginatedConnectionsResponse = await fetchPendingRequests(apiClient, username, {
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
      console.error(`Failed to fetch pending requests page ${page} for ${username}:`, err);
      const message = err instanceof Error ? err.message : t('friendsPage.error.pendingLoad', 'Failed to load pending requests.');
      setError(message);
      setStatus('failed');
      // Avoid redundant toasts if handled elsewhere
      // toast.error(message);
    } finally {
      isLoadingMore.current = false;
      isNewFetch.current = false;
      if (status === 'loading' && !error) {
          setStatus(requests.length > 0 || totalRequests > 0 ? 'succeeded' : 'idle');
      }
    }
  }, [username, t, status, error, requests.length, totalRequests]);

  // Last element ref callback for infinite scroll
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (status === 'loading' || isLoadingMore.current) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages) {
          triggerFetch(currentPage + 1);
        }
      },
      { threshold: 0.8 }
    );

    if (node) observer.current.observe(node);
  }, [currentPage, totalPages, status, triggerFetch]);

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
  const handleAccept = async (initiatorUsername: string, friendId: number) => {
    setUpdatingRequestId(friendId);
    try {
      await acceptFriendRequest(apiClient, initiatorUsername);
      toast.success(t('friendsPage.toast.requestAccepted', 'Friend request accepted!'));
      // Remove the accepted request from the list
      setRequests((prev) => prev.filter((req) => req.username !== initiatorUsername));
      setTotalRequests(prev => prev - 1); // Decrement total count
    } catch (err) {
      const message = err instanceof Error ? err.message : t('friendsPage.error.acceptFailed', 'Failed to accept request.');
      toast.error(message);
      console.error(`Error accepting request from ${initiatorUsername}:`, err);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleDecline = async (otherUsername: string, friendId: number) => {
    setUpdatingRequestId(friendId);
    try {
      await declineFriendRequest(apiClient, otherUsername);
      toast.info(t('friendsPage.toast.requestDeclined', 'Friend request declined.'));
      // Remove the declined request from the list
      setRequests((prev) => prev.filter((req) => req.username !== otherUsername));
      setTotalRequests(prev => prev - 1); // Decrement total count
    } catch (err) {
      const message = err instanceof Error ? err.message : t('friendsPage.error.declineFailed', 'Failed to decline request.');
      toast.error(message);
      console.error(`Error declining request from ${otherUsername}:`, err);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // --- Render Logic ---
  return (
    <Box sx={{ width: '100%' }}>
      {/* Initial Loading Skeleton */} 
      {status === 'loading' && requests.length === 0 && (
        <List dense sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {[...Array(3)].map((_, index) => <PendingRequestSkeleton key={`skeleton-${index}`} />)}
        </List>
      )}

      {/* Error Display */} 
      {status === 'failed' && !isLoadingMore.current && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* No Pending Requests */} 
      {status === 'succeeded' && requests.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <AccessibleTypography color="text.secondary">
            {t('friendsPage.noPending', 'No pending friend requests.')}
          </AccessibleTypography>
        </Box>
      )}

      {/* Pending Requests List */} 
      {requests.length > 0 && (
        <List dense sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
          {requests.map((request, index) => {
            const isUpdating = updatingRequestId === request.friendId;
            const attachObserver = requests.length >= 4 ? index === requests.length - 4 : index === 0;
            
            // Conditionally render ListItemButton or ListItem based on isUpdating
            return isUpdating ? (
                <ListItem
                    key={request.friendId}
                    divider
                    sx={{
                      py: 1.5,
                      opacity: 0.6,
                      transition: 'opacity 0.2s ease-in-out',
                    }}
                  >
                    <ListItemAvatar sx={{ mt: 0.5 }}>
                       <Avatar src={request.profilePicture || undefined} alt={request.displayName} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          {request.displayName}
                        </Typography>
                      }
                      secondary={`@${request.username}`}
                    />
                    <ListItemSecondaryAction>
                       <CircularProgress size={24} sx={{ mr: 2 }} />
                    </ListItemSecondaryAction>
                 </ListItem>
            ) : (
              <ListItemButton
                key={request.friendId}
                divider
                ref={attachObserver ? lastElementRef : undefined}
                sx={{ py: 1.5 }}
                component={RouterLink} // Use RouterLink directly here
                to={`/people/${request.username}`}
                onClick={() => {
                    if (onNavigate) {
                        onNavigate();
                    }
                }}
              >
                <ListItemAvatar sx={{ mt: 0.5 }}>
                  <Avatar src={request.profilePicture || undefined} alt={request.displayName} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="medium">
                      {request.displayName}
                    </Typography>
                  }
                  secondary={`@${request.username}`}
                />
                <ListItemSecondaryAction>
                    {/* Actions are only shown when not updating */}
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title={t('friends.buttons.accept', 'Accept') as string}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             handleAccept(request.username, request.friendId);
                          }}
                          sx={{
                            color: theme.palette.success.main,
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.success.main, 0.2),
                            },
                          }}
                        >
                          <CheckCircleIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('friends.buttons.decline', 'Decline') as string}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDecline(request.username, request.friendId);
                          }}
                          sx={{
                            color: theme.palette.error.main,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.2),
                            },
                          }}
                        >
                          <XCircleIcon size={20} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                </ListItemSecondaryAction>
              </ListItemButton>
            );
          })}
        </List>
      )}

      {/* Loading More Skeleton */} 
      {status === 'loading' && requests.length > 0 && (
         <List dense sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            <PendingRequestSkeleton />
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

export default PendingRequestsList; 