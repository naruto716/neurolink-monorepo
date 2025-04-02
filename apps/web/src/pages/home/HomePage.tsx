import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import {
  BookmarkSimple,
  ChatDots,
  DotsThree,
  Heart,
  ShareNetwork,
  UserPlus
} from '@phosphor-icons/react';
import React, { useEffect } from 'react';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { NAVBAR_HEIGHT } from '../../app/layout/navbar/Navbar';
// Import RootState along with the hooks
import { RootState, useAppDispatch, useAppSelector } from '../../app/store/initStore';
// Import shared selectors with aliases
import { User } from '@neurolink/shared';
import {
  fetchPaginatedUsers,
  selectPaginatedUsers as selectSharedPaginatedUsers,
  selectPaginatedUsersError as selectSharedPaginatedUsersError,
  selectPaginatedUsersStatus as selectSharedPaginatedUsersStatus
} from '@neurolink/shared/src/features/user/paginatedUsersSlice';
import apiClient from '../../app/api/apiClient';

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
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2.5, alignItems: 'center' }}>
      <Avatar src={user.profilePicture || PLACEHOLDER_AVATAR} sx={{ width: 48, height: 48 }} />
      <Box sx={{ flexGrow: 1 }}>
        <AccessibleTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {user.displayName}
        </AccessibleTypography>
        {/* Removed user.title display */}
      </Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<UserPlus size={16} />}
        sx={{ alignSelf: 'center', flexShrink: 0 }}
      >
        Connect
      </Button>
    </Stack>
  );
};

// --- Wrapper Selectors for HomePage ---
const selectPaginatedUsers = (state: RootState) => selectSharedPaginatedUsers(state);
const selectPaginatedUsersStatus = (state: RootState) => selectSharedPaginatedUsersStatus(state);
const selectPaginatedUsersError = (state: RootState) => selectSharedPaginatedUsersError(state);

// --- Main HomePage Component ---
const HomePage = () => {
  const dispatch = useAppDispatch();
  // Use the local wrapper selectors
  const suggestedUsers = useAppSelector(selectPaginatedUsers); 
  const status = useAppSelector(selectPaginatedUsersStatus);
  const error = useAppSelector(selectPaginatedUsersError);

  // Fetch suggested users on component mount
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPaginatedUsers({ apiClient, limit: 5, page: 1 })); 
    }
  }, [status, dispatch]);

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
            People You Might Like
          </Typography>
          
          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={30} />
            </Box>
          )}
          {status === 'failed' && (
            <Alert severity="error" sx={{ mb: 2 }}>{error || 'Failed to load suggestions.'}</Alert>
          )}
          {status === 'succeeded' && (
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
                    No suggestions available right now.
                  </Typography>
                )}
              </Stack>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                 <Button variant="text" /* onClick={() => {}} // Add navigation later */ >
                   Find More People
                 </Button>
              </Box>
            </>
          )}
        </Paper>
      </Grid>

    </Grid>
  );
};

export default HomePage;
