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
  // useTheme, // No longer needed
} from '@mui/material';
import { PostResponseDTO } from '@neurolink/shared'; // Renamed from ForumPostDTO
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChatCircleDots, Heart } from '@phosphor-icons/react'; // Removed PlayCircle
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';

interface ForumPostCardProps {
  post: PostResponseDTO; // Use the renamed type
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
  // const theme = useTheme(); // No longer needed

  const handleCardClick = () => {
    navigate(`/forum/posts/${post.id}`);
  };

  // Function to extract the first image URL from markdown
  const extractFirstImageUrl = (markdown: string): string | null => {
    if (!markdown) return null;
    const imageRegex = /!\[.*?\]\((.*?)\)/; // Capture the URL part
    const match = markdown.match(imageRegex);
    return match ? match[1] : null;
  };

  // Function to extract the first video URL from HTML video tag
  const extractFirstVideoUrl = (htmlString: string): string | null => {
    if (!htmlString) return null;
    const videoRegex = /<video.*?src=["'](.*?)["'].*?>/i; // Capture the src part
    const match = htmlString.match(videoRegex);
    return match ? match[1] : null;
  };

  // Updated function to strip markdown, now completely removing images
  const sanitizeMarkdownPreview = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/<video.*?<\/video>/gi, '') // Remove video tags
      .replace(/#{1,6}\s/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/^\s*>\s?/gm, '')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/\n{2,}/g, '\n') // Collapse multiple newlines to one
      .replace(/\n/g, ' ') // Replace remaining newlines with spaces
      .trim();
  };

  const firstImageUrl = extractFirstImageUrl(post.content);
  const firstVideoUrl = extractFirstVideoUrl(post.content); // Check for video

  return (
    // Attach the forwarded ref to the Paper element
    <Paper
      elevation={0} // Flat initially
      sx={(theme) => ({ // Use function form to access theme
        p: 2,
        borderRadius: '8px',
        cursor: 'pointer',
        // Remove default background, inherit from parent
        backgroundColor: 'transparent',
        transition: theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
        }),
        '&:hover': {
          // Apply appropriate hover based on theme mode
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.08) // Increase alpha for more noticeable hover
            : alpha(theme.palette.action.hover, 0.04),
        },
      })} // Add missing closing parenthesis
// Removed extra closing braces
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

        {/* Media Preview: Show image or video icon */}
        {firstImageUrl && !firstVideoUrl && ( // Show image only if no video found first
          <Box sx={{ my: 1.5, overflow: 'hidden', borderRadius: '8px' }}>
            <img
              src={firstImageUrl}
              alt={t('forum.postImagePreviewAlt', 'Post image preview')}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
        )}
        {firstVideoUrl && ( // Show video player if video found
           <Box
             sx={{ my: 1.5, overflow: 'hidden', borderRadius: '8px', bgcolor: 'action.hover' /* Optional background */ }}
             onClick={(e) => e.stopPropagation()} // Stop click propagation here
           >
             <video
               src={firstVideoUrl}
               controls // Add basic playback controls
               style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
               preload="metadata" // Load only metadata initially for performance
             >
               {t('common.videoUnsupported', 'Your browser does not support the video tag.')}
             </video>
           </Box>
        )}

        {/* Post Content Preview */}
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
            {sanitizeMarkdownPreview(post.content)} {/* Display sanitized content */}
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