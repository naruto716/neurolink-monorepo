import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
  Tooltip,
  Link,
  Skeleton
} from '@mui/material';
import {
  BookmarkSimple,
  ChatDots,
  DotsThree,
  Heart,
  ShareNetwork,
  ArrowSquareOut,
  CaretRight
} from '@phosphor-icons/react';
import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { NAVBAR_HEIGHT } from '../../app/layout/navbar/Navbar';
// Import RootState along with the hooks
import { RootState, useAppDispatch, useAppSelector } from '../../app/store/initStore';
// Import shared selectors with aliases
import { User, fetchPaginatedUsers } from '@neurolink/shared';
import {
  selectPaginatedUsers as selectSharedPaginatedUsers,
  selectPaginatedUsersError as selectSharedPaginatedUsersError,
  selectPaginatedUsersStatus as selectSharedPaginatedUsersStatus,
  selectUsersCurrentPage,
  selectUsersTotalPages
} from '@neurolink/shared/src/features/user/paginatedUsersSlice';
import apiClient from '../../app/api/apiClient';
import { useTranslation } from 'react-i18next';

// Placeholder data
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/600x400";
const PLACEHOLDER_AVATAR = "https://via.placeholder.com/150";

// Sample post data
const posts = [
  // ... (post data remains the same)
  {
    id: 1,
    username: 'Dr. Sarah Chen',
    userHandle: '@sarah_neuro',
    avatar: PLACEHOLDER_AVATAR,
    date: '2h ago',
    content: 'Excited about our latest findings on memory consolidation during sleep! 🧠 Preliminary results suggest specific neural pathways are more active than previously thought. #neuroscience #memory #research',
    image: PLACEHOLDER_IMAGE,
    likes: 142,
    comments: 18,
    shares: 5,
  },
  {
    id: 2,
    username: 'Cognitive Insights Lab',
    userHandle: '@coginsights',
    avatar: PLACEHOLDER_AVATAR,
    date: 'Yesterday',
    content: 'We\'re recruiting participants for a study on attention mechanisms in neurodivergent adults. DM us if interested! #research #neurodiversity #attention #study',
    likes: 88,
    comments: 25,
    shares: 12,
  },
];

// --- Components ---

const PostCard: React.FC<{ post: typeof posts[0] }> = ({ post }) => {
  const theme = useTheme();
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar src={post.avatar} sx={{ width: 48, height: 48 }} />
          <Box sx={{ flexGrow: 1 }}>
            <AccessibleTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {post.username}
            </AccessibleTypography>
            <Typography variant="caption" color="text.secondary">
              {post.userHandle} · {post.date}
            </Typography>
          </Box>
          <IconButton size="small">
            <DotsThree size={20} weight="bold" />
          </IconButton>
        </Stack>
        <AccessibleTypography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </AccessibleTypography>
        {post.image && (
          <Box sx={{ borderRadius: '8px', overflow: 'hidden', mb: 2, border: `1px solid ${theme.palette.divider}` }}>
            <img src={post.image} alt={`Post by ${post.username}`} style={{ width: '100%', display: 'block', height: 'auto' }} />
          </Box>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<Heart size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' } }}>
              {post.likes}
            </Button>
            <Button size="small" startIcon={<ChatDots size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
              {post.comments}
            </Button>
            <Button size="small" startIcon={<ShareNetwork size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) } }}>
              {post.shares}
            </Button>
          </Stack>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <BookmarkSimple size={18} />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

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
           <Avatar src={PLACEHOLDER_AVATAR} />
           <Typography color="text.secondary" sx={{ flexGrow: 1 }}>What's on your mind?</Typography>
           <Button variant="contained">Post</Button>
        </Paper>

        <Box>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </Box>
      </Grid>

      {/* --- Right Sidebar Column (People You Might Like) --- */}
      <Grid item md={4} lg={5} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper sx={theme => ({ p: 2.5, position: 'sticky', top: NAVBAR_HEIGHT + 24, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.palette.mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.2)' })}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('social.suggestionsTitle', 'People You Might Like')}
          </Typography>
          
          {/* Loading State */}
          {suggestionsStatus === 'loading' && (
            <Stack spacing={2.5} sx={{ p: 1 }}>
              {[...Array(4)].map((_, index) => ( 
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
