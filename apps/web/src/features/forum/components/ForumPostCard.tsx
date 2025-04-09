import React from 'react';
import {
  Avatar,
  Box,
  // Card, // Remove Card
  // CardActionArea, // Remove CardActionArea
  // CardContent, // Remove CardContent
  // CardHeader, // Remove CardHeader
  Paper, // Use Paper for background and hover
  Chip,
  // Divider, // Removed unused import
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { ForumPostDTO } from '@neurolink/shared';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChatCircleDots, Heart } from '@phosphor-icons/react'; // Icons for comments/likes
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';

interface ForumPostCardProps {
  post: ForumPostDTO;
  // Add optional props for user details fetched in parent
  displayName?: string;
  profilePicture?: string | null;
  // Ref is optional, only passed for the last item
  ref?: React.Ref<HTMLDivElement>;
}

// Use React.forwardRef to accept the ref
const ForumPostCard = React.forwardRef<HTMLDivElement, ForumPostCardProps>(({ post, displayName, profilePicture }, ref) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCardClick = () => {
    navigate(`/forum/posts/${post.id}`);
  };

  return (
    // Attach the forwarded ref to the Paper element
    <Paper
      elevation={0} // Flat initially
      sx={{
        p: 2, // Add padding directly
        borderRadius: '8px', // Slightly less rounded
        cursor: 'pointer',
        transition: (theme) => theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
        }),
        '&:hover': {
          // Change background color on hover
          bgcolor: (theme) => alpha(theme.palette.action.hover, 0.04),
        },
      }}
      onClick={handleCardClick}
      aria-label={`${t('forum.viewPost', 'View post')}: ${post.title}`}
      ref={ref} // Attach the ref here
    >
        {/* Post Header Info */}
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
             <Avatar
                src={profilePicture || undefined} // Use fetched picture
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
             >
                {/* Fallback to first letter of username if no picture/displayName */}
               {!profilePicture ? (displayName || post.username).charAt(0).toUpperCase() : null}
             </Avatar>
             <Typography variant="caption" sx={{ fontWeight: 500 }}>
               {/* Use displayName if available, otherwise username */}
               {displayName || post.username}
             </Typography>
             <Typography variant="caption" color="text.secondary">
               • {new Date(post.created_at).toLocaleDateString()} {/* Use a separator */}
             </Typography>
        </Stack>

        {/* Post Content */}
        <Box>
          <AccessibleTypography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
            {post.title}
          </AccessibleTypography>
          <AccessibleTypography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3, // Limit to 3 lines
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
            {post.content} {/* Display full content, CSS handles truncation */}
          </AccessibleTypography>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {post.tags.slice(0, 5).map((tag) => ( // Limit displayed tags
                <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.75rem' }} />
              ))}
            </Box>
          )}

          {/* Likes and Comments Count */}
          <Stack direction="row" spacing={2} alignItems="center">
             <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <Heart size={16} />
                <Typography variant="caption">{post.likes}</Typography>
             </Stack>
             <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <ChatCircleDots size={16} /> {/* Corrected icon name */}
                <Typography variant="caption">{post.comments_count}</Typography>
             </Stack>
          </Stack>

        </Box>
    </Paper>
  );
});

export default ForumPostCard;