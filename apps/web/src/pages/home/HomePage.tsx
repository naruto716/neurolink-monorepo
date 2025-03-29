import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  // Chip, // Removed unused import
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  // Tooltip, // Removed unused import
  Typography,
  useTheme,
  Divider,
  alpha // Added alpha import
} from '@mui/material';
import {
  BookmarkSimple,
  ChatDots,
  DotsThree,
  Heart,
  // Plus, // Removed unused import
  ShareNetwork,
  UserPlus // Icon for follow/connect button
} from '@phosphor-icons/react';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { NAVBAR_HEIGHT } from '../../app/layout/navbar/Navbar'; // Added NAVBAR_HEIGHT import

// Placeholder data (can be replaced with actual API data later)
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/600x400"; // Generic placeholder
const PLACEHOLDER_AVATAR = "https://via.placeholder.com/150"; // Generic avatar placeholder

// Sample post data
const posts = [
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
  {
    id: 3,
    username: 'Alex Rivera',
    userHandle: '@alex_codes',
    avatar: PLACEHOLDER_AVATAR,
    date: '3 days ago',
    content: 'Working on a new data visualization tool for EEG data. Trying to make complex patterns more accessible. Any suggestions for libraries? #dataviz #eeg #neurotech #opensource',
    likes: 215,
    comments: 45,
    shares: 20,
  }
];

// Sample "People You Might Like" data
const suggestions = [
  {
    id: 101,
    name: 'Larry',
    title: 'Computer Science Student',
    avatar: PLACEHOLDER_AVATAR,
    interests: ['Coding', 'Drawing', 'Fitness', 'Reading', 'Hiking'],
    bio: 'Fellow student with ADHD at UoA! My nickname is...'
  },
  {
    id: 102,
    name: 'Emma',
    title: 'Psychology Student',
    avatar: PLACEHOLDER_AVATAR,
    interests: ['Netflix', 'Foodie', 'Coffee', 'Cooking'],
    bio: 'Hi, my name is Emma! I study Psychology at UoA, hoping to...'
  },
  {
    id: 103,
    name: 'Sofia',
    title: 'Law Student',
    avatar: PLACEHOLDER_AVATAR,
    interests: ['Netball', 'Film-making', 'Fashion', 'Hiking', 'Reading'],
    bio: 'Hey there, I am Sofia. I have a passion for making short films...'
  },
];

// --- Components for the new layout ---

// Post Card Component
const PostCard: React.FC<{ post: typeof posts[0] }> = ({ post }) => {
  const theme = useTheme();
  return (
    <Card sx={{ mb: 3 }}> {/* Use theme's default Card style */}
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Post Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar src={post.avatar} sx={{ width: 48, height: 48 }} />
          <Box sx={{ flexGrow: 1 }}>
            {/* Use AccessibleTypography for username */}
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

        {/* Post Content */}
        <AccessibleTypography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}> {/* Preserve line breaks */}
          {post.content}
        </AccessibleTypography>

        {/* Post Image (Optional) */}
        {post.image && (
          <Box sx={{
            borderRadius: '8px', // Rounded image corners
            overflow: 'hidden',
            mb: 2,
            border: `1px solid ${theme.palette.divider}` // Subtle border
          }}>
            <img
              src={post.image}
              alt={`Post by ${post.username}`}
              style={{ width: '100%', display: 'block', height: 'auto' }}
            />
          </Box>
        )}

        {/* Post Actions */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<Heart size={18} />}
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' } }}
            >
              {post.likes}
            </Button>
            <Button
              size="small"
              startIcon={<ChatDots size={18} />}
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
            >
              {post.comments}
            </Button>
            <Button
              size="small"
              startIcon={<ShareNetwork size={18} />}
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) } }}
            >
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

// Suggestion Card Component
const SuggestionCard: React.FC<{ user: typeof suggestions[0] }> = ({ user }) => {
  // const theme = useTheme(); // Removed unused theme variable
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
      <Avatar src={user.avatar} sx={{ width: 48, height: 48 }} />
      <Box sx={{ flexGrow: 1 }}>
        {/* Use AccessibleTypography for name */}
        <AccessibleTypography variant="subtitle2" sx={{ fontWeight: 600 }}>{user.name}</AccessibleTypography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {user.title}
        </Typography>
        {/* Optional: Show a snippet of bio or interests */}
        {/* <Typography variant="caption" color="text.secondary">{user.bio.substring(0, 50)}...</Typography> */}
      </Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<UserPlus size={16} />}
        sx={{ alignSelf: 'center', flexShrink: 0 }}
      >
        Connect {/* Or Follow */}
      </Button>
    </Stack>
  );
};


// --- Main HomePage Component ---
const HomePage = () => {
  // const theme = useTheme(); // Removed unused theme variable

  return (
    <Grid container spacing={3} sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 1, sm: 2, md: 3 } }}>

      {/* --- Center Feed Column --- */}
      <Grid item xs={12} md={8} lg={7}> {/* Adjust grid sizing as needed */}
        {/* Optional: Create Post Input Area */}
        {/* Apply Card-like styles directly to this Paper */}
        <Paper sx={theme => ({ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          borderRadius: '12px', // Re-apply rounded corners
          border: `1px solid ${theme.palette.divider}`, // Re-apply border
          // Add a subtle shadow for better visual separation
          boxShadow: theme.palette.mode === 'light' 
            ? '0 1px 2px rgba(0,0,0,0.05)' 
            : '0 1px 2px rgba(0,0,0,0.2)', 
        })}>
           <Avatar src={PLACEHOLDER_AVATAR} />
           <Typography color="text.secondary" sx={{ flexGrow: 1 }}>What's on your mind?</Typography>
           <Button variant="contained">Post</Button>
        </Paper>

        {/* Post Feed */}
        <Box>
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </Box>
      </Grid>

      {/* --- Right Sidebar Column (People You Might Like) --- */}
      {/* Hide on smaller screens */}
      <Grid item md={4} lg={5} sx={{ display: { xs: 'none', md: 'block' } }}>
        {/* Apply Card-like styles directly to this Paper */}
        <Paper sx={theme => ({ 
          p: 2.5, 
          position: 'sticky', 
          top: NAVBAR_HEIGHT + 24, // Sticky sidebar
          borderRadius: '12px', // Re-apply rounded corners
          border: `1px solid ${theme.palette.divider}`, // Re-apply border
           // Add a subtle shadow for better visual separation
          boxShadow: theme.palette.mode === 'light' 
            ? '0 1px 2px rgba(0,0,0,0.05)' 
            : '0 1px 2px rgba(0,0,0,0.2)',
        })}> 
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            People You Might Like
          </Typography>
          <Stack spacing={0}> {/* Use spacing=0 on Stack if SuggestionCard has margin */}
            {suggestions.map((user, index) => (
              <React.Fragment key={user.id}>
                <SuggestionCard user={user} />
                {index < suggestions.length - 1 && <Divider sx={{ my: 1.5 }} />}
              </React.Fragment>
            ))}
          </Stack>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
             <Link href="#" variant="body2" sx={{ textDecoration: 'none' }}>
               View All Suggestions
             </Link>
          </Box>
        </Paper>
      </Grid>

    </Grid>
  );
};

export default HomePage;
