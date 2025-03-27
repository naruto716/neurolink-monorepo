import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  IconButton,
  Button,
  useTheme,
  Chip,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Plus, 
  Heart,
  ChatDots,
  BookmarkSimple,
  ShareNetwork,
  DotsThree
} from '@phosphor-icons/react';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { checkHealth, HealthResponse } from '@neurolink/shared';

const PLACEHOLDER_IMAGE = "https://d2ymeg1i7s1elw.cloudfront.net/646a09264a49e84e5f28d73c_0_0.png?quality=lossless";

const HomePage = () => {
  const theme = useTheme();
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Check API health on component mount
  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const response = await checkHealth();
        setHealthStatus(response);
        setOpenSnackbar(true);
      } catch (err) {
        console.error('Error checking API health:', err);
        setError('Failed to connect to the API. Please check if the server is running.');
        setOpenSnackbar(true);
      }
    };

    fetchHealthStatus();
  }, []);

  // Sample story data
  const stories = [
    { id: 1, username: 'emma_psy', avatar: PLACEHOLDER_IMAGE },
    { id: 2, username: 'neuro_mark', avatar: PLACEHOLDER_IMAGE },
    { id: 3, username: 'brain_research', avatar: PLACEHOLDER_IMAGE },
    { id: 4, username: 'cognitive_labs', avatar: PLACEHOLDER_IMAGE },
    { id: 5, username: 'neural_net', avatar: PLACEHOLDER_IMAGE }
  ];

  // Sample post data
  const posts = [
    {
      id: 1,
      username: 'Dr. Sarah Chen',
      avatar: PLACEHOLDER_IMAGE,
      date: 'Today at 10:45 AM',
      content: 'Just published our new research on cognitive neuroscience! The findings suggest that neural patterns during memory formation are more complex than previously thought.',
      image: PLACEHOLDER_IMAGE,
      likes: 42,
      comments: 8,
      tags: ['neuroscience', 'research', 'memory']
    },
    {
      id: 2,
      username: 'James Wilson',
      avatar: PLACEHOLDER_IMAGE,
      date: 'Yesterday at 3:22 PM',
      content: 'Looking for collaborators on our new brain-computer interface project. We\'re exploring non-invasive methods for neural signal detection with promising early results.',
      likes: 24,
      comments: 15,
      tags: ['BCI', 'collaboration', 'neurotechnology']
    },
    {
      id: 3,
      username: 'Neural Networks Lab',
      avatar: PLACEHOLDER_IMAGE,
      date: '2 days ago',
      content: 'Excited to announce our latest breakthrough in neural networks for brain mapping! Our new algorithm achieves 40% better accuracy than previous methods.',
      image: PLACEHOLDER_IMAGE,
      likes: 153,
      comments: 37,
      tags: ['AI', 'neural-mapping', 'breakthrough']
    }
  ];

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      {/* API Status Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {error || `API connection successful: ${healthStatus?.status || 'OK'}`}
        </Alert>
      </Snackbar>

      {/* Recent Stories Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600, color: theme.palette.text.primary }}>
          Recent Stories
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          overflowX: 'auto', 
          pb: 2,
          '::-webkit-scrollbar': {
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: '10px',
          },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            }
          }
        }}>
          {/* Add Story Button */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 1.5
          }}>
            <Avatar 
              sx={{ 
                width: 88, 
                height: 88,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.15)' : '#E3F5FF',
                color: theme.palette.primary.main,
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: theme.palette.primary.main,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Plus size={36} weight="bold" />
            </Avatar>
            <Typography variant="caption" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
              Add Story
            </Typography>
          </Box>
          
          {/* Story Items */}
          {stories.map(story => (
            <Box 
              key={story.id}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Avatar
                src={story.avatar}
                sx={{ 
                  width: 88, 
                  height: 88,
                  cursor: 'pointer',
                  boxShadow: '0 0 0 3px #E3F5FF, 0 0 0 6px rgba(66, 133, 244, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 0 3px #E3F5FF, 0 0 0 6px rgba(66, 133, 244, 0.4)'
                  }
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
                {story.username}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recent Posts Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Recent Posts
          </Typography>
          
          <Tooltip title="Create post">
            <IconButton 
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.15)' : '#E3F5FF',
                color: theme.palette.primary.main,
                width: 44,
                height: 44,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.25)' : '#D0EBFF',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Plus size={24} weight="bold" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Grid container spacing={4}>
          {posts.map(post => (
            <Grid item xs={12} key={post.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#F8FCFF',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  {/* Post Header */}
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={post.avatar} 
                        sx={{ 
                          width: 48, 
                          height: 48,
                          border: '2px solid',
                          borderColor: theme.palette.primary.main
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {post.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {post.date}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton>
                      <DotsThree size={24} weight="bold" />
                    </IconButton>
                  </Box>
                  
                  {/* Post Content */}
                  <Box sx={{ px: 3, pb: 2 }}>
                    <AccessibleTypography 
                      variant="body1" 
                      sx={{ 
                        mb: 2.5, 
                        lineHeight: 1.6,
                        color: theme.palette.text.primary,
                        fontSize: '1rem'
                      }}
                    >
                      {post.content}
                    </AccessibleTypography>

                    {/* Tags */}
                    {post.tags && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                        {post.tags.map(tag => (
                          <Chip 
                            key={tag} 
                            label={`#${tag}`} 
                            size="small"
                            sx={{ 
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.15)' : '#E3F5FF',
                              color: theme.palette.primary.main,
                              fontWeight: 500,
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.25)' : '#D0EBFF',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Post Image */}
                  {post.image && (
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: { xs: 240, sm: 320, md: 380 },
                        position: 'relative',
                        mb: 2
                      }}
                    >
                      <img 
                        src={post.image}
                        alt="Post attachment"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </Box>
                  )}
                  
                  {/* Post Actions */}
                  <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button 
                        startIcon={<Heart weight="duotone" />}
                        size="small"
                        sx={{ 
                          color: theme.palette.text.secondary,
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.08)',
                            color: '#E91E63'
                          }
                        }}
                      >
                        {post.likes}
                      </Button>
                      <Button 
                        startIcon={<ChatDots weight="duotone" />}
                        size="small"
                        sx={{ 
                          color: theme.palette.text.secondary,
                          '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.08)',
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {post.comments}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                        <BookmarkSimple weight="duotone" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                        <ShareNetwork weight="duotone" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      </Box>
    </Box>
  );
};

export default HomePage; 