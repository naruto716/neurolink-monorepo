import {
  Alert,
  // alpha, // Unused
  Avatar,
  Box,
  Button,
  // Card, // Unused
  // CardContent, // Unused
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  // useTheme, // No longer needed here
  Tooltip,
  Link,
  Skeleton
} from '@mui/material';
import {
  // BookmarkSimple, // Moved to PostCard component
  // ChatDots, // Moved to PostCard component
  // DotsThree, // Moved to PostCard component
  // Heart, // Moved to PostCard component
  // ShareNetwork, // Moved to PostCard component
  ArrowSquareOut,
  CaretRight,
  ArrowClockwise // Import icon for refresh button
} from '@phosphor-icons/react';
import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { NAVBAR_HEIGHT } from '../../app/layout/navbar/Navbar';
// Import RootState along with the hooks
import { RootState, useAppDispatch, useAppSelector } from '../../app/store/initStore';
// Import shared selectors with aliases
import { User, fetchPaginatedUsers, selectFeedPostsCurrentPage, selectFeedPostsStatus, selectFeedPostsTotalPages } from '@neurolink/shared'; // Added feed selectors
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

// Placeholder data and inline PostCard removed

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

  return (
    <Grid container spacing={3} sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>

      {/* --- Center Feed Column --- */}
      <Grid item xs={12} md={8} lg={7}>
        <Paper sx={theme => ({ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.2)' })}>
           {/* TODO: Replace with current user's avatar */}
           <Avatar />
           <Typography color="text.secondary" sx={{ flexGrow: 1 }}>What's on your mind?</Typography>
           <Button variant="contained">Post</Button>
        </Paper>

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
        <Paper sx={theme => ({ p: 2.5, position: 'sticky', top: NAVBAR_HEIGHT + 24, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.2)' })}>
          {/* Title and Refresh Button */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('social.suggestionsTitle', 'People You Might Like')}
            </Typography>
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
          
          {/* Loading State */}
          {suggestionsStatus === 'loading' && (
            <Stack spacing={2.5} sx={{ p: 1 }}>
              {[...Array(10)].map((_, index) => ( 
                 <Stack key={index} direction="row" spacing={2} alignItems="center"> 
                   <Skeleton variant="circular" width={48} height={48} />
                   <Box sx={{ flexGrow: 1 }}>
                     <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                     <Skeleton variant="text" width="40%" sx={{ fontSize: '0.75rem' }} />
                   </Box>
                 </Stack>
              ))}
            </Stack>
          )}
          {/* Failed State */}
          {suggestionsStatus === 'failed' && (
            <Alert severity="error" sx={{ mb: 2 }}>{suggestionsError}</Alert>
          )}
          {/* Succeeded State - Corrected condition */}
          {suggestionsStatus === 'succeeded' && (
            <>
              <Stack spacing={0}>
                {suggestedUsers.length > 0 ? (
                  suggestedUsers.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <SuggestionCard user={user} />
                      {index < suggestedUsers.length - 1 && <Divider sx={{ my: 1.5 }} />}
                    </React.Fragment>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    {t('social.noSuggestions', 'No suggestions available right now.')}
                  </Typography>
                )}
              </Stack>
              {/* Updated More Button - only show if there are pages to navigate */}
              {suggestionsTotalPages > 0 && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="text" 
                    onClick={handleMoreSuggestions}
                    // @ts-expect-error - Linter incorrectly flags this valid comparison
                    disabled={suggestionsStatus === 'loading'} 
                    endIcon={<CaretRight size={16}/>}
                  >
                    {t('common.more', 'More')}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Grid>

    </Grid>
  );
};

export default SocialPage;
