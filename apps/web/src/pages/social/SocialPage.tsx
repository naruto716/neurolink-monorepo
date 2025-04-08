import {
  Alert,
  // alpha, // Unused
  alpha, // Add alpha import
  Avatar,
  Box,
  Button,
  CircularProgress, // Add CircularProgress import
  // Card, // Unused
  // CardContent, // Unused
  Divider,
  Grid,
  IconButton, // Add IconButton import
  Paper,
  Stack,
  Tooltip, // Add Tooltip import
  Typography,
  Link,
  // Skeleton // No longer used
  Chip, // Add Chip import
} from '@mui/material';
import {
  // BookmarkSimple, // Moved to PostCard component
  // ChatDots, // Moved to PostCard component
  // DotsThree, // Moved to PostCard component
  // Heart, // Moved to PostCard component
  // ShareNetwork, // Moved to PostCard component
  CaretRight,
  ArrowClockwise, // Import icon for refresh button
  UserPlus, // Add UserPlus for connect button
} from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react'; // Add useState import
import { Link as RouterLink } from 'react-router-dom';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { NAVBAR_HEIGHT } from '../../app/layout/navbar/Navbar';
// Import RootState along with the hooks
import { RootState, useAppDispatch, useAppSelector } from '../../app/store/initStore';
// Import shared selectors with aliases
import { fetchPaginatedUsers, selectFeedPostsCurrentPage, selectFeedPostsStatus, selectFeedPostsTotalPages, sendFriendRequest } from '@neurolink/shared'; // Removed unused User import // Added feed selectors // Added sendFriendRequest
import {
  selectPaginatedUsers as selectSharedPaginatedUsers,
  selectPaginatedUsersError as selectSharedPaginatedUsersError,
  selectPaginatedUsersStatus as selectSharedPaginatedUsersStatus,
  selectUsersCurrentPage,
  selectUsersTotalPages
} from '@neurolink/shared/src/features/user/paginatedUsersSlice';
import apiClient from '../../app/api/apiClient';
import { useTranslation } from 'react-i18next';
import FeedPosts from '../../features/posts/components/FeedPosts'; // Import the new FeedPosts component
import CreatePostInput from '../../features/posts/components/CreatePostInput'; // Import the new CreatePostInput component
import { toast } from 'react-toastify'; // Import toast

// Placeholder data and inline PostCard removed

// SuggestionCard removed as it's replaced by the inline implementation in the sidebar
/*
const SuggestionCard: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const profileUrl = `/people/${user.username}`;

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2.5, alignItems: 'center' }}>
      <RouterLink to={profileUrl} style={{ textDecoration: 'none' }}>
        <Avatar src={user.profilePicture || undefined} sx={{ width: 48, height: 48 }} />
      </RouterLink>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Link 
          component={RouterLink} 
          to={profileUrl}
          color="inherit"
          underline="none"
          sx={{ 
             display: 'block', 
          }}
        >
          <AccessibleTypography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}
          >
            {user.displayName}
          </AccessibleTypography>
        </Link>
        {user.bio && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{
              display: '-webkit-box', 
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mt: 0.5
            }}
          >
            {user.bio}
          </Typography>
        )}
      </Box>
      <Tooltip title={t('people.viewProfileButton', 'View Profile')}>
        <IconButton 
          component={RouterLink} 
          to={profileUrl} 
          size="small" 
          sx={{ alignSelf: 'center', flexShrink: 0 }} 
          aria-label={t('people.viewProfileButton', 'View Profile')}
        >
          <ArrowSquareOut size={20} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
*/

// --- Wrapper Selectors ---
const selectPaginatedUsers = (state: RootState) => selectSharedPaginatedUsers(state);
const selectPaginatedUsersStatus = (state: RootState) => selectSharedPaginatedUsersStatus(state);
const selectPaginatedUsersError = (state: RootState) => selectSharedPaginatedUsersError(state);
const selectCurrentSuggestionPage = (state: RootState) => selectUsersCurrentPage(state);
const selectTotalSuggestionPages = (state: RootState) => selectUsersTotalPages(state);

// --- Main HomePage Component ---
const SocialPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [connectingUsernames, setConnectingUsernames] = useState<Set<string>>(new Set()); // State to track connecting status per user
  
  // --- Use Redux State for Suggestions ---
  const SUGGESTIONS_PAGE_SIZE = 10;
  const suggestedUsers = useAppSelector(selectPaginatedUsers);
  const suggestionsStatus = useAppSelector(selectPaginatedUsersStatus);
  const suggestionsError = useAppSelector(selectPaginatedUsersError);
  const suggestionsCurrentPage = useAppSelector(selectCurrentSuggestionPage);
  const suggestionsTotalPages = useAppSelector(selectTotalSuggestionPages);
  // --- End Redux State ---

  // --- Feed State for End of Feed Message ---
  const feedStatus = useAppSelector(selectFeedPostsStatus);
  const feedCurrentPage = useAppSelector(selectFeedPostsCurrentPage);
  const feedTotalPages = useAppSelector(selectFeedPostsTotalPages);
  // --- End Feed State ---

  // Fetch initial suggestions on component mount
  useEffect(() => {
    if (suggestionsStatus === 'idle') {
      dispatch(fetchPaginatedUsers({ 
        apiClient, 
        limit: SUGGESTIONS_PAGE_SIZE,
        page: 1 
      }));
    }
  }, [suggestionsStatus, dispatch]);

  // Handle clicking the 'More' button
  const handleMoreSuggestions = () => {
    // Scroll to top when fetching new suggestions, using requestAnimationFrame for reliability
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });

    const nextPage = suggestionsCurrentPage >= suggestionsTotalPages
      ? 1 
      : suggestionsCurrentPage + 1;
    dispatch(fetchPaginatedUsers({ 
      apiClient, 
      limit: SUGGESTIONS_PAGE_SIZE, 
      page: nextPage 
    }));
  };

  // Handle clicking the Connect button
  const handleConnectClick = async (username: string, displayName: string) => {
    if (connectingUsernames.has(username)) return; // Prevent multiple clicks

    setConnectingUsernames(prev => new Set(prev).add(username)); // Add username to connecting set
    try {
        await sendFriendRequest(apiClient, username);
        toast.success(t('people.toast.requestSent', 'Friend request sent to {displayName}!', { displayName }));
        // Optionally, you might want to update the UI further (e.g., change button state permanently)
        // For now, we just remove it from the loading state upon completion/error.
    } catch (err) {
        const message = err instanceof Error ? err.message : t('people.error.sendRequestFailed', 'Failed to send friend request.');
        toast.error(message);
        console.error("Error sending friend request from SocialPage sidebar:", err);
    } finally {
        setConnectingUsernames(prev => {
            const newSet = new Set(prev);
            newSet.delete(username);
            return newSet;
        }); // Remove username from connecting set
    }
  };

  return (
    <Grid container spacing={3} sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>

      {/* --- Center Feed Column --- */}
      <Grid item xs={12} md={8} lg={7}>
        {/* --- Create Post Input --- */}
        <CreatePostInput />


        {/* Replace placeholder mapping with FeedPosts component */}
        <FeedPosts />

        {/* Add "More Suggestions" button below the feed */}
        {suggestionsTotalPages > 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={handleMoreSuggestions}
              disabled={suggestionsStatus === 'loading'}
              endIcon={<CaretRight size={16}/>}
            >
              {t('common.more', 'More')} {t('social.suggestionsTitle', 'People You Might Like')}
            </Button>
          </Box>
        )}

        {/* End of Feed Indicator */}
        {feedStatus === 'succeeded' && feedCurrentPage === feedTotalPages && feedTotalPages > 0 && (
          <Box sx={{ textAlign: 'center', mt: 1, mb: 2 }}> {/* Adjusted margin */}
            <Typography color="text.secondary" variant="caption">
              {t('social.endOfFeed', "You've reached the end of the feed.")}
            </Typography>
          </Box>
        )}
      </Grid>

      {/* --- Right Sidebar Column (People You Might Like) --- */}
      <Grid item md={4} lg={5} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper sx={theme => ({ 
          p: 2, // Slightly reduced padding
          position: 'sticky', 
          top: NAVBAR_HEIGHT + 24, 
          borderRadius: '12px', 
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none', // Remove shadow for subtlety
          bgcolor: theme.palette.background.paper,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': {
            background: 'transparent', // Or theme.palette.background.default
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.action.selected, // Or a subtle color
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.action.active, // Darker on hover
          },
        })}>
          {/* Wrap Title and Refresh Button in a Stack */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {t('social.suggestionsTitle', 'People You Might Like')}
            </Typography>
            {/* Add Refresh IconButton here */} 
            {suggestionsTotalPages > 0 && (
              <Tooltip title={t('social.refreshSuggestions', 'Refresh Suggestions')}>
                <span> {/* Span needed for tooltip when button is disabled */} 
                  <IconButton
                    size="small"
                    onClick={handleMoreSuggestions}
                    disabled={suggestionsStatus === 'loading'}
                    aria-label={t('social.refreshSuggestions', 'Refresh Suggestions')}
                  >
                    <ArrowClockwise size={20} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
          
          {suggestionsStatus === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {suggestionsStatus === 'failed' && (
            <Alert severity="error" sx={{ mb: 2 }}>{suggestionsError || t('social.suggestionsError', 'Failed to load suggestions.')}</Alert>
          )}
          {suggestionsStatus === 'succeeded' && (
            <>
              {suggestedUsers.length > 0 ? (
                // Map ALL suggested users (old functionality)
                suggestedUsers.map((user, index, arr) => {
                  const isConnecting = connectingUsernames.has(user.username);
                  const MAX_TAGS_DISPLAYED_SIDEBAR = 3; // Limit tags shown in sidebar

                  // Filter and limit tags (prioritize skills/interests/program)
                  const prioritizedTags = [
                      ...(user.tags?.filter(tag => ['skill', 'interest', 'programOfStudy'].includes(tag.type)) || []),
                      ...(user.tags?.filter(tag => !['skill', 'interest', 'programOfStudy'].includes(tag.type)) || []),
                  ].slice(0, MAX_TAGS_DISPLAYED_SIDEBAR);

                  return (
                    <React.Fragment key={user.id}>
                      <Box sx={{ py: 1 }}> {/* Reduced padding */}
                        {/* User header with avatar and name */}
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1 }}>
                          <Avatar 
                            component={RouterLink}
                            to={`/people/${user.username}`}
                            src={user.profilePicture || undefined} // Use undefined for default MUI avatar if no picture
                            sx={{ width: 40, height: 40, cursor: 'pointer' }} 
                          /> {/* Smaller avatar */}
                          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Link 
                              component={RouterLink} 
                              to={`/people/${user.username}`}
                              color="inherit"
                              underline="hover"
                              sx={{ display: 'block' }}
                            >
                              <AccessibleTypography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.displayName}
                              </AccessibleTypography>
                            </Link>
                            {/* TODO: Replace with actual user role/details if available - CHANGED TO USERNAME */}
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {/* {t('social.placeholderRole', 'Neurolink User')} */}
                              @{user.username} {/* Display @username */}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleConnectClick(user.username, user.displayName)}
                            disabled={isConnecting} // Disable button while connecting
                            startIcon={isConnecting ? <CircularProgress size={16} color="inherit" /> : <UserPlus size={16}/>} // Show spinner or icon
                            sx={{ 
                              borderRadius: '20px', 
                              px: 1.5,
                              py: 0.3,
                              fontSize: '0.75rem',
                              alignSelf: 'flex-start', 
                              flexShrink: 0 
                            }}
                          >
                            {/* Update button text based on state */}
                            {isConnecting ? t('common.sending', 'Sending...') : t('common.connect', 'Connect')}
                          </Button>
                        </Stack>
                        
                        {/* Tags Section (Added) */} 
                        {prioritizedTags.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: user.bio ? 1 : 0 }}> {/* Add margin top and conditionally bottom */}
                            {prioritizedTags.map((tag) => (
                              <Chip
                                key={`${tag.type}-${tag.value}`}
                                label={tag.value}
                                size="small"
                                // Optional: Add sx for specific styling if needed
                                sx={{ fontSize: '0.7rem' }} // Make chips slightly smaller
                              />
                            ))}
                          </Box>
                        )}
                        
                        {/* Bio in card */}
                        {user.bio && (
                          <Paper 
                            elevation={0} 
                            sx={(theme) => ({ 
                              p: 1.2, 
                              bgcolor: theme.palette.background.default,
                              borderRadius: '8px',
                              mb: 1,
                              fontSize: '0.8rem'
                            })}
                          >
                            <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                              {user.bio}
                            </Typography>
                          </Paper>
                        )}
                        
                        {/* View Full Profile button */}
                        <Button 
                          variant="text" 
                          fullWidth
                          component={RouterLink}
                          to={`/people/${user.username}`}
                          sx={(theme) => ({
                            borderRadius: '8px',
                            py: 0.6,
                            bgcolor: alpha(theme.palette.primary.light, 0.1), // Use theme color
                            color: theme.palette.primary.main, // Use theme color
                            fontSize: '0.8rem',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.light, 0.2) // Adjust hover
                            }
                          })}
                        >
                          {t('people.viewFullProfile', 'View Full Profile')}
                        </Button>
                        
                        {/* Divider between users */}
                        {index < arr.length - 1 && (
                          <Divider sx={{ mt: 1.5, mb: 0.5 }} />
                        )}
                      </Box>
                    </React.Fragment>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('social.noSuggestions', 'No suggestions available right now.')}
                </Typography>
              )}
            </>
          )}
        </Paper>
      </Grid>

    </Grid>
  );
};

export default SocialPage;
