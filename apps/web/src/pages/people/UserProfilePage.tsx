import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom'; // Import Link
import {
  Box,
  Container,
  Alert,
  Avatar,
  Chip,
  Stack,
  Typography,
  useTheme,
  alpha,
  Button,
  // Grid, // Removed unused import
  Tabs,
  Tab,
  Skeleton, // Import Skeleton
  Dialog,           // Import Dialog
  DialogTitle,      // Import DialogTitle
  DialogContent,    // Import DialogContent
  IconButton,       // Import IconButton
  Menu, // Added Menu
  MenuItem, // Added MenuItem
  ListItemIcon, // Added ListItemIcon
  ListItemText, // Added ListItemText
  Card,
  CardHeader,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Added MoreVertIcon
import { useTranslation } from 'react-i18next';
import apiClient from '../../app/api/apiClient';
// Remove unused PaginatedPostsResponse import
import { User, Tag, fetchUserByUsername, Post, fetchUserPosts, fetchUserFriendCount, sendFriendRequest, selectCurrentUser, fetchConnectionStatus, declineFriendRequest } from '@neurolink/shared'; // Removed selectRefreshRequested, clearRefreshRequest
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { toast } from 'react-toastify';
import PostCard from '../../features/posts/components/PostCard'; // Import the new PostCard component
import CreatePostInput from '../../features/posts/components/CreatePostInput'; // <-- Import CreatePostInput
import { ChatText, LockSimple, UserCircleMinus, UserPlus, UserMinus, PencilSimple } from '@phosphor-icons/react'; // Added PencilSimple
import FriendList from '../../features/friends/components/FriendList'; // Import FriendList
import { useAppSelector } from '../../app/store/initStore'; // Removed useAppDispatch if no longer needed (verify)

// Define Tag Categories mapping
const tagCategoryLabels: { [key: string]: string } = {
  programOfStudy: 'onboarding.programOfStudy',
  yearLevel: 'onboarding.yearLevel',
  neurodivergence: 'onboarding.neurodivergenceStatus',
  interest: 'onboarding.interests',
  skill: 'onboarding.skills',
  language: 'onboarding.languages',
  course: 'onboarding.courses',
};

// TabPanel component helper
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

// Skeleton component for the profile header
const UserProfileSkeleton = () => {
  const theme = useTheme();
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4, md: 6 }} sx={{ mb: 4, alignItems: 'center' }}>
          <Skeleton variant="circular" sx={{ width: { xs: 100, sm: 130, md: 150 }, height: { xs: 100, sm: 130, md: 150 }, border: `4px solid ${theme.palette.background.paper}` }} />
          <Stack spacing={2} sx={{ flexGrow: 1, width: '100%' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Skeleton variant="text" width="40%" height={40} />
              <Stack direction="row" spacing={1.5}>
                <Skeleton variant="rounded" width={100} height={30} sx={{ borderRadius: '8px' }} />
                <Skeleton variant="rounded" width={90} height={30} />
              </Stack>
            </Stack>
            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <Skeleton variant="text" width={30} height={24} sx={{ mb: 0.5 }}/>
                <Skeleton variant="text" width={50} height={20} />
              </Box>
              <Box textAlign="center">
                <Skeleton variant="text" width={30} height={24} sx={{ mb: 0.5 }}/>
                <Skeleton variant="text" width={50} height={20} />
              </Box>
            </Stack>
            <Stack spacing={1}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="30%" height={16} />
            </Stack>
          </Stack>
        </Stack>
        {/* Skeleton for Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center', mb: 3 }}>
           <Skeleton variant="text" width={80} height={48} sx={{ mr: 2 }} />
           <Skeleton variant="text" width={80} height={48} />
        </Box>
         {/* Skeleton for Tab Content Area */}
         <Skeleton variant="rectangular" height={200} />
      </Box>
    </Container>
  );
};

// Component to display when profile is not found or private
const ProfileUnavailable = ({ message }: { message: string }) => {
  const theme = useTheme(); // Get theme for background color
  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          // Optional: Add background and border for more emphasis
          // backgroundColor: alpha(theme.palette.warning.light, 0.1),
          // border: `1px dashed ${theme.palette.divider}`,
          // borderRadius: 2,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <LockSimple size={64} color={theme.palette.text.secondary} /> {/* Larger icon, use theme color */}
          <Typography variant="h5" component="h2" color="text.primary"> {/* More prominent title */}
            Profile Unavailable
          </Typography>
          <Typography color="text.secondary">
            {message} {/* Display the specific reason */}
          </Typography>
          {/* Optional: Add a button to go back or to the people page */}
          {/* <Button component={RouterLink} to="/people" variant="outlined" sx={{ mt: 2 }}>
            Back to People
          </Button> */}
        </Stack>
      </Box>
    </Container>
  );
};

// Skeleton for Post Card
const PostCardSkeleton = () => (
  <Card sx={{ mb: 2 }}> {/* Assuming PostCard uses Card */} 
    <CardHeader
      avatar={<Skeleton variant="circular" width={40} height={40} />}
      title={<Skeleton variant="text" width="40%" height={20} />}
      subheader={<Skeleton variant="text" width="20%" height={14} />}
    />
    <CardContent sx={{ pt: 0 }}>
      <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" />
    </CardContent>
    {/* Optionally add skeleton for actions */}
  </Card>
);

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation();
  // const navigate = useNavigate(); // Removed unused hook
  const theme = useTheme();
  // const dispatch = useAppDispatch(); // Remove dispatch if unused
  const currentUser = useAppSelector(selectCurrentUser); // Get current user
  // const refreshRequested = useAppSelector(selectRefreshRequested); // Remove refresh state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // For user profile loading
  const [error, setError] = useState<string | null>(null); // For user profile error
  
  // --- Posts State --- 
  const [posts, setPosts] = useState<Post[]>([]); 
  const [postsLoading, setPostsLoading] = useState(false); 
  const [postsError, setPostsError] = useState<string | null>(null); 
  const [totalPosts, setTotalPosts] = useState<number>(0); // Reinstate totalPosts
  const [currentPostsPage, setCurrentPostsPage] = useState(0); 
  const [totalPostsPages, setTotalPostsPages] = useState(0);
  const isLoadingMorePosts = useRef(false);
  const postsObserver = useRef<IntersectionObserver | null>(null);
  const isNewPostFetch = useRef(true);
  // --- End Posts State ---

  // --- Friend Count State ---
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [friendCountLoading, setFriendCountLoading] = useState(false);
  const [friendCountError, setFriendCountError] = useState<string | null>(null);
  // --- End Friend Count State ---

  // --- Friend Modal State ---
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  // --- End Friend Modal State ---

  // --- Connection State (Simplified) --- 
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'connected' | 'not_connected' | 'self'>('idle');
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);
  // --- End Connection State ---

  // --- Menu State --- 
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  // --- End Menu State ---

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fetch User Profile & Connection Status
  useEffect(() => {
    const fetchUserAndStatus = async () => {
      if (!username || !currentUser) {
        setError(t('userProfile.error.missingUsername', 'Username is missing.'));
        setLoading(false);
        return;
      }
      
      if (username === currentUser.username) {
        setUser(currentUser);
        setConnectionStatus('self');
        setLoading(false);
        return; 
      }

      setLoading(true);
      setError(null);
      setConnectionStatus('loading'); // Start loading status
      try {
        const fetchedUserPromise = fetchUserByUsername(apiClient, username);
        const connectionStatusPromise = fetchConnectionStatus(apiClient, username);

        const [fetchedUserData, statusResult] = await Promise.all([
            fetchedUserPromise,
            connectionStatusPromise
        ]);

        setUser(fetchedUserData);
        setConnectionStatus(statusResult.isFriend ? 'connected' : 'not_connected');
        
      } catch (err) {
        console.error('Failed to fetch user profile or connection status:', err);

        let specificErrorMessage = t('userProfile.error.genericLoad', 'Failed to load user profile.');
        let showToast = true; // Default to showing toast

        // Type check for Axios-like error structure
        if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'status' in err.response) {
            const status = err.response.status;
            if (status === 404) {
                specificErrorMessage = t('userProfile.error.notFound', 'User not found or profile is private.');
                showToast = false; // Don't show toast for 404
            } else if (status === 403) {
                specificErrorMessage = t('userProfile.error.private', 'This profile is private or you do not have permission to view it.');
                showToast = false; // Don't show toast for 403
            } else if ('message' in err && typeof err.message === 'string') {
                 // Use specific message from error if available (for other HTTP errors)
                 specificErrorMessage = err.message;
            }
        } else if (err instanceof Error) {
             // Handle generic JavaScript errors, but check for specific messages first
             if (err.message.startsWith('User not found:')) {
                 specificErrorMessage = t('userProfile.error.notFound', 'User not found.'); // Use consistent translation
                 showToast = false;
             } else if (err.message.includes('private')) { // Check if message indicates privacy issue
                 specificErrorMessage = t('userProfile.error.private', 'This profile is private or you do not have permission to view it.');
                 showToast = false;
             } else {
                specificErrorMessage = err.message; // Use the error message for other JS errors
             }
        }
        // else: Keep the default generic load error message and showToast = true

        setError(specificErrorMessage);

        // Show toast only for generic/unexpected errors
        if (showToast) {
            toast.error(specificErrorMessage);
        }
         setConnectionStatus('idle'); // Reset status on error
      } finally {
        setLoading(false); 
      }
    };
    // Only run if currentUser is loaded
    if(currentUser) {
        fetchUserAndStatus();
    }
    // Reset state if username changes
    return () => {
        setUser(null);
        setError(null);
        setLoading(true);
        setConnectionStatus('idle');
        // Reset other states like posts, friend count etc.
        setPosts([]);
        setCurrentPostsPage(0);
        setTotalPostsPages(0);
        setTotalPosts(0);
        setFriendCount(null);
        setFriendCountLoading(false);
        setFriendCountError(null);
        setIsFriendModalOpen(false);
    };
  }, [username, t, currentUser]); // Add currentUser dependency

  // Fetch Friend Count
  useEffect(() => {
    const getFriendCount = async () => {
      if (!username) return;
      setFriendCountLoading(true);
      setFriendCountError(null);
      try {
        const count = await fetchUserFriendCount(apiClient, username);
        setFriendCount(count);
      } catch (err) {
        console.error('Failed to fetch friend count:', err);
        const message = err instanceof Error ? err.message : t('userProfile.error.friendCountLoad', 'Failed to load friend count.');
        setFriendCountError(message);
        // Optionally show a toast error for friend count failure
        // toast.error(message);
      } finally {
        setFriendCountLoading(false);
      }
    };
    getFriendCount();
  }, [username, t]); // Re-fetch if username changes

  // Fetch User Posts
  const POSTS_PER_PAGE = 5; // Set posts per page to 5

  const triggerPostFetch = useCallback(async (page: number, isNew: boolean = false) => {
    if (!username || isLoadingMorePosts.current) return;

    if (isNew) {
        isNewPostFetch.current = true;
        setPostsLoading(true);
        setPosts([]); 
        setCurrentPostsPage(0); 
        setTotalPostsPages(0);
        setTotalPosts(0); // Reset total posts on new fetch
    } else {
        isLoadingMorePosts.current = true;
        setPostsLoading(false); 
    }
    setPostsError(null);

    try {
      const response = await fetchUserPosts(apiClient, username, page, POSTS_PER_PAGE);
      
      // --- Updated setPosts logic ---
      setPosts(prev => {
        if (isNewPostFetch.current) {
           // If it's a new fetch, completely replace the posts
           return response.posts ?? []; // Handle undefined posts
        } else {
           // If loading more, filter out duplicates before appending
           const existingIds = new Set(prev.map(p => p.id));
           const newUniquePosts = (response.posts ?? []).filter(p => !existingIds.has(p.id)); // Handle undefined posts
           return [...prev, ...newUniquePosts];
        }
      });
      // --- End Updated setPosts logic ---

      setCurrentPostsPage(response.page ?? 0); // Handle undefined page
      setTotalPosts(response.totalPosts ?? 0); // Update total posts count, handle undefined
      setTotalPostsPages(Math.ceil((response.totalPosts ?? 0) / (response.limit || POSTS_PER_PAGE))); // Handle undefined totalPosts
      isNewPostFetch.current = false; // Reset flag after state update is queued
    } catch (err) {
      console.error(`Failed to fetch posts page ${page} for ${username}:`, err);
      const message = err instanceof Error ? err.message : t('userProfile.error.postsLoad', 'Failed to load posts.');
      setPostsError(message);
    } finally {
      setPostsLoading(false); 
      isLoadingMorePosts.current = false;
    }
  }, [username, t]);

  // Initial posts fetch and refetch on username change
  useEffect(() => {
    if (username) {
      triggerPostFetch(1, true); // Fetch page 1 as a new fetch
    }
    // Cleanup function to clear posts if username changes? Optional.
    return () => {
        setPosts([]);
        setCurrentPostsPage(0);
        setTotalPostsPages(0);
    }
  }, [username, triggerPostFetch]);

  // Intersection Observer for Posts
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (postsLoading || isLoadingMorePosts.current) return;
    if (postsObserver.current) postsObserver.current.disconnect();

    postsObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPostsPage < totalPostsPages) {
        console.log('Post Infinite scroll triggered');
        triggerPostFetch(currentPostsPage + 1); // Fetch next page
      }
    }, { threshold: 0.8 }); // Trigger when 80% visible

    if (node) postsObserver.current.observe(node);
  }, [postsLoading, isLoadingMorePosts, currentPostsPage, totalPostsPages, triggerPostFetch]);

  // Group Tags - Fix reduce and types
  const groupedTags = user?.tags?.reduce((acc: { [key: string]: Tag[] }, tag: Tag) => {
    const type = tag.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(tag);
    return acc; // Return accumulator
  }, {} as { [key: string]: Tag[] });

  // --- Action Handlers --- 
  const handleSendRequest = async () => {
    if (!user || connectionStatus !== 'not_connected') return;
    setIsProcessingConnection(true);
    try {
      await sendFriendRequest(apiClient, user.username);
      // Optimistically update to 'connected' as backend handles pending states simply
      setConnectionStatus('connected'); 
      toast.success(t('userProfile.toast.requestSent', 'Friend request sent!')); 
    } catch (err) {
      const message = err instanceof Error ? err.message : t('userProfile.error.sendRequestFailed', 'Failed to send friend request.');
      toast.error(message);
      console.error("Error sending friend request:", err);
    }
    setIsProcessingConnection(false);
  };

  const handleUnfriend = async () => {
    if (!user || connectionStatus !== 'connected') return;
    handleMenuClose(); // Close menu first
    setIsProcessingConnection(true);
    try {
      await declineFriendRequest(apiClient, user.username); // Use declineFriendRequest which calls DELETE
      setConnectionStatus('not_connected'); // Update status 
      toast.info(t('userProfile.toast.unfriended', { displayName: user.displayName })); 
    } catch (err) {
       const message = err instanceof Error ? err.message : t('userProfile.error.unfriendFailed', 'Failed to remove friend.');
       toast.error(message);
       console.error("Error unfriending user:", err);
    } finally { // Ensure processing state is reset even on error
        setIsProcessingConnection(false);
    }
  };

  // --- Render Logic ---

  if (loading) { // Show skeleton while fetching user profile
    return <UserProfileSkeleton />;
  }

  // Handle error states
  if (error) {
    const isNotFound = error.includes(t('userProfile.error.notFound', 'User not found.'));
    const isPrivate = error.includes(t('userProfile.error.private', 'This profile is private'));

    // Show the dedicated component for not found/private errors
    if (isNotFound || isPrivate) {
      return <ProfileUnavailable message={error} />;
    }

    // Show generic error Alert for other errors
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Handle case where loading finished but user is still null (should ideally be caught by error handling)
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">{t('userProfile.error.notFound', 'User not found.')}</Alert>
      </Container>
    );
  }

  // Conditional rendering of action buttons based on connectionStatus
  const renderConnectionButton = () => {
    switch (connectionStatus) {
      case 'loading':
        return <Skeleton variant="rounded" width={100} height={30} sx={{ borderRadius: '8px' }} />;
      case 'connected':
        return (
           <>
            <Button variant="outlined" size="small" disabled startIcon={<UserCircleMinus size={16} weight="regular" />}>
                {t('userProfile.friends', 'Friends')}
            </Button>
             <IconButton 
               size="small" 
               onClick={handleMenuClick} 
               disabled={isProcessingConnection}
               aria-controls={openMenu ? 'connection-menu' : undefined}
               aria-haspopup="true"
               aria-expanded={openMenu ? 'true' : undefined}
            >
                 <MoreVertIcon />
            </IconButton>
            <Menu
                id="connection-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                MenuListProps={{
                'aria-labelledby': 'connection-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
            >
                <MenuItem onClick={handleUnfriend} disabled={isProcessingConnection}>
                   <ListItemIcon>
                       <UserMinus size={18} />
                   </ListItemIcon>
                   <ListItemText primary={t('userProfile.unfriend', 'Unfriend')} />
                </MenuItem>
                {/* Add other actions like Block later if needed */}
            </Menu>
           </>
        );
      case 'not_connected':
      default:
        return (
          <Button variant="contained" size="small" sx={{ borderRadius: '8px' }} disabled={isProcessingConnection} onClick={handleSendRequest} startIcon={<UserPlus size={16} weight="regular" />}>
            {isProcessingConnection ? t('common.sending', 'Sending...') : t('userProfile.addFriend', 'Add Friend')}
          </Button>
        );
    }
  };

  // Render profile page once user data is available
  return (
    <> {/* Use Fragment to wrap page and modal */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        {/* Profile Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4, md: 6 }} sx={{ mb: 4, alignItems: 'center' }}>
          <Avatar src={user.profilePicture || undefined} alt={user.displayName} sx={{ width: { xs: 100, sm: 130, md: 150 }, height: { xs: 100, sm: 130, md: 150 }, border: `4px solid ${theme.palette.background.paper}`, boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}` }} />
          <Stack spacing={2} sx={{ flexGrow: 1, width: '100%' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="h5" sx={{ fontWeight: 400 }}>{user.displayName}</Typography>
              {/* Action Buttons - Render based on connection status */}
              {connectionStatus !== 'self' && ( // Don't show buttons on own profile
                 <Stack direction="row" spacing={1} alignItems="center">
                   {renderConnectionButton()}
                   <Button variant="text" size="small" startIcon={<ChatText size={16} weight="regular" />}>
                    {t('people.messageButton', 'Message')}
                  </Button>
                </Stack>
              )}
              {/* Add Edit Profile button for self */}
              {connectionStatus === 'self' && (
                 <Button
                    component={RouterLink}
                    to="/profile/edit"
                    variant="outlined"
                    size="small"
                    startIcon={<PencilSimple size={16} />}
                 >
                    {t('editProfile.editButton', 'Edit Profile')} {/* Add translation */}
                 </Button>
              )}
            </Stack>
            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{totalPosts}</Typography>
                <Typography variant="body2" color="text.secondary">{t('userProfile.posts', 'posts')}</Typography>
              </Box>
              <Box
                textAlign="center"
                // Open modal on click instead of navigating
                onClick={() => setIsFriendModalOpen(true)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                  position: 'relative', // For loader positioning
                }}
              >
                {friendCountLoading ? (
                  // Use Skeleton for friend count loading
                  <Skeleton variant="text" width={30} height={24} sx={{ margin: 'auto' }} />
                ) : (
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {friendCountError ? '!' : friendCount ?? '-'}
                  </Typography>
                )}
                <Typography variant="body2" color={friendCountError ? 'error' : 'text.secondary'}>
                  {t('userProfile.friends', 'friends')}
                </Typography>
              </Box>
            </Stack>
            <Stack spacing={0.5}>
              {user.bio && <AccessibleTypography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{user.bio}</AccessibleTypography>}
              {user.age && <AccessibleTypography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>{t('people.yearsOld', { age: user.age })}</AccessibleTypography>}
            </Stack>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label={t('userProfile.tabsLabel', 'Profile content tabs')} centered textColor="primary" indicatorColor="primary">
            <Tab label={t('userProfile.tabPosts', 'POSTS')} {...a11yProps(0)} sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }} />
            <Tab label={t('userProfile.tabTags', 'TAGS')} {...a11yProps(1)} sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {/* Render CreatePostInput if it's the current user's profile */}
          {connectionStatus === 'self' && <CreatePostInput onPostSuccess={() => triggerPostFetch(1, true)} />} {/* Pass callback */}

          {/* Posts Loading (Initial) - Use Skeleton */}
          {postsLoading && posts.length === 0 && (
            <Stack spacing={2} sx={{ pt: 3 }}>
              {[...Array(3)].map((_, index) => <PostCardSkeleton key={`post-skeleton-${index}`} />)}
            </Stack>
          )}
          {/* Posts Error (Initial/Major) */}
          {postsError && posts.length === 0 && !postsLoading && (
            <Alert severity="error" sx={{ mt: 2 }}>{postsError}</Alert>
          )}
          {/* Posts List */}
          {!postsLoading && posts.length > 0 && (
            <Stack spacing={2}> 
              {posts.map((post, index) => {
                // Attach observer N elements from the end
                const attachObserver = posts.length >= 3 
                  ? index === posts.length - 3 
                  : index === 0;
                return (
                  <Box key={post.id} ref={attachObserver ? lastPostElementRef : undefined}>
                     <PostCard post={post} /> 
                  </Box>
                )
              })}
            </Stack>
          )}
          {/* No Posts Message */}
          {!postsLoading && !postsError && posts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <AccessibleTypography color="text.secondary">{t('userProfile.noPosts', 'No posts yet.')}</AccessibleTypography>
              </Box>
          )}
          {/* Loading More Indicator - Use Skeleton */}
          {isLoadingMorePosts.current && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, mt: 1 }}>
               <PostCardSkeleton /> { /* Show one skeleton when loading more */}
            </Box>
          )}
           {/* End of Results Indicator */}
          {!isLoadingMorePosts.current && currentPostsPage === totalPostsPages && posts.length > 0 && (
            <Box sx={{ textAlign: 'center', p: 3, mt: 1 }}>
              <Typography color="text.secondary">
                {t('people.endOfResults', "You've reached the end of the results")} 
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Tags Section */}
          {groupedTags && Object.keys(groupedTags).length > 0 ? (
            <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
              {Object.entries(groupedTags).map(([type, tags]) => (
                // Wrap each category in a Box with padding and border
                <Box key={type} sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius * 1.5, // Slightly more rounded
                  // backgroundColor: alpha(theme.palette.background.default, 0.5) // Optional: subtle background
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize', color: theme.palette.text.primary, mb: 1.5 }}>
                    {t(tagCategoryLabels[type] || type, type.replace(/([A-Z])/g, ' $1'))}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {tags.map((tag, index) => (
                      <Chip 
                        key={`${tag.type}-${tag.value}-${index}`} 
                        label={tag.value} 
                        size="small" 
                        variant="outlined" // Revert back to outlined variant
                        sx={{ 
                          cursor: 'default', // Ensure default cursor
                          // Remove hover effect by keeping styles the same or using default
                          '&:hover': { 
                            // For outlined variant, the default hover is often just a slight border change
                            // We can explicitly set background to transparent if needed
                            backgroundColor: 'transparent' 
                          }
                        }}
                      /> 
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 5 }}><AccessibleTypography color="text.secondary">{t('userProfile.noTags', 'No tags added yet.')}</AccessibleTypography></Box>
          )}
        </TabPanel>
      </Box>
      </Container>

      {/* Friend List Modal */}
      {username && (
        <FriendListModal
          open={isFriendModalOpen}
          onClose={() => setIsFriendModalOpen(false)}
          username={username}
        />
      )}
    </>
  );
};

export default UserProfilePage;

// Friend List Modal Component
const FriendListModal = ({ open, onClose, username }: { open: boolean; onClose: () => void; username: string }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {t('friends.modalTitle', 'Friends')}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}> 
        {/* Render FriendList only when username is valid, passing onClose as onNavigate */}
        {username ? (
          <FriendList username={username} onNavigate={onClose} />
        ) : (
          <Alert severity="error">Username not provided.</Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};
