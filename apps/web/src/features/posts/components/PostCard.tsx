import React, { useState } from 'react';
// Removed Paper
import { Card, CardContent, Box, alpha, useTheme, Typography, Stack, Avatar, IconButton, Button } from '@mui/material'; 
import { Post } from '@neurolink/shared';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import { formatDistanceToNow } from 'date-fns';
// Import icons used in HomePage's PostCard - Removed ShareNetwork and BookmarkSimple
import { ChatDots, Heart, DotsThree } from '@phosphor-icons/react'; 
import { useTranslation } from 'react-i18next';

// React Slick imports
import Slider from 'react-slick';
// Import css files
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Import ReactPlayer
import ReactPlayer from 'react-player/lazy'; // Use lazy load for efficiency

// Import Intersection Observer hook
import { useInView } from 'react-intersection-observer';

interface PostCardProps {
  post: Post;
  // Add props for author info, needed for displaying posts outside their own profile
  authorDisplayName: string;
  authorProfilePicture?: string;
}

// Helper function to determine media type
const getMediaType = (type: string): 'image' | 'video' | 'audio' | 'unknown' => {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'unknown';
};

const PostCard: React.FC<PostCardProps> = ({ post, authorDisplayName, authorProfilePicture }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  // State to track current slide
  const [currentSlide, setCurrentSlide] = useState(0);

  // Intersection Observer hook
  const { ref, inView } = useInView({
    threshold: 0.5, // Trigger when 50% of the card is visible
    triggerOnce: false, // Observe continuously
  });

  // Filter out unknown media types or handle them as needed
  const validMedia = post.mediaUrls?.filter(media => getMediaType(media.type) !== 'unknown') || [];

  // Format timestamp
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  } catch (e) {
    console.error("Error formatting date:", e);
    timeAgo = post.createdAt; // Fallback
  }

  // Check if current media is a video
  const isCurrentMediaVideo = () => {
    if (validMedia.length > 0 && currentSlide >= 0 && currentSlide < validMedia.length) {
      const currentMedia = validMedia[currentSlide];
      return getMediaType(currentMedia.type) === 'video';
    }
    return false;
  };

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true, // Enable looping
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    // Remove slick-hidden class logic as arrows should always be potentially visible in infinite mode
    prevArrow: <button type="button" className="slick-prev">‹</button>,
    nextArrow: <button type="button" className="slick-next">›</button>,
    beforeChange: (_current: number, next: number) => setCurrentSlide(next)
  };

  return (
    // Attach ref to the Card for Intersection Observer
    <Card ref={ref} sx={{ mb: 2, minHeight: 'auto' }}> {/* Use Card and margin bottom, set minHeight to auto */}
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}> {/* Use CardContent and padding */}
        {/* Author Info */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <Avatar src={authorProfilePicture || undefined} sx={{ width: 44, height: 44 }} />
          <Box sx={{ flexGrow: 1 }}>
            <AccessibleTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {authorDisplayName}
            </AccessibleTypography>
            <Typography variant="caption" color="text.secondary">
              {/* TODO: Add user handle if available */}
              {timeAgo}
            </Typography>
          </Box>
          <IconButton size="small">
            <DotsThree size={20} weight="bold" />
          </IconButton>
        </Stack>

        {/* Post Content */}
        <AccessibleTypography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </AccessibleTypography>

        {/* Media Display Area */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <Box sx={{ 
            position: 'relative',
            borderRadius: '8px', 
            overflow: 'hidden', 
            mb: 2,
            // Apply overflow hidden more strongly
            '& .slick-list': {
              borderRadius: '8px', // Apply radius to the slider container as well
              overflow: 'hidden', // Ensure the overflow is hidden
            },
            // Dots styling with conditional display based ONLY on media type
            '.slick-dots': {
              bottom: '10px',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              // Hide dots completely when current slide is a video
              display: isCurrentMediaVideo() ? 'none !important' : 'block',
              'li button:before': {
                color: 'white',
              },
              'li.slick-active button:before': {
                color: 'white',
              }
            },
            // Arrow styling
            '.slick-arrow': {
              position: 'absolute',
              zIndex: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              fontSize: '36px',
              lineHeight: '1',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              opacity: 0, // Hide by default
              transition: 'opacity 0.3s ease', // Smooth transition
              '&:hover': {
                opacity: 1 // Fully visible on direct hover
              }
            },
            '.slick-prev': {
              left: '15px'
            },
            '.slick-next': {
              right: '15px'
            },
            // Remove the before/after content styles
            '.slick-prev:before, .slick-next:before': {
              content: 'none'
            },
            // --- CONTAINER HOVER START ---
            '&:hover': {
              '.slick-arrow': {
                opacity: 0.7,
              },
              '.slick-dots': {
                // Only show dots on hover if current slide is NOT a video
                opacity: isCurrentMediaVideo() ? 0 : 1,
              }
            }
            // --- CONTAINER HOVER END ---
          }}>
            {validMedia.length === 1 ? (
              // Display single media item directly if only one valid media
              (() => {
                const media = validMedia[0]; // media is { url: string; type: string }
                const mediaType = getMediaType(media.type); // Access media.type

                if (mediaType === 'image') {
                  return (
                    <img 
                      src={media.url} // Access media.url
                      alt={t('post.imageAlt', 'Post image')} 
                      style={{ width: '100%', display: 'block', objectFit: 'cover', borderRadius: '8px' }} 
                    />
                  );
                } else if (mediaType === 'video') {
                  return (
                    <Box sx={{ position: 'relative', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden' }}>
                      <ReactPlayer 
                        url={media.url}
                        controls 
                        width='100%'
                        height='100%'
                        playing={inView} // Play only if card is in view
                        muted={true} // Keep muted for autoplay
                        style={{ position: 'absolute', top: 0, left: 0 }}
                      />
                    </Box>
                  );
                } else if (mediaType === 'audio') {
                  return (
                     <audio controls src={media.url} style={{ width: '100%', display: 'block' }}> {/* Access media.url */}
                        {t('post.audioUnsupported', 'Your browser does not support the audio tag.')}
                     </audio>
                  );
                }
                return null; // Should not happen due to filtering
              })()
            ) : validMedia.length > 1 ? (
              // Use carousel for multiple media items
              // @ts-expect-error - Disable TypeScript error, the component works correctly at runtime
              <Slider {...sliderSettings}>
                {validMedia.map((media, index) => { // Iterate over validMedia, media is { url: string; type: string }
                  const mediaType = getMediaType(media.type); // Access media.type
                  return (
                    <div key={index}>
                      {mediaType === 'image' && (
                        <img 
                          src={media.url} // Access media.url
                          alt={t('post.imageAltWithNumber', `Post image ${index + 1}`)} 
                          style={{ width: '100%', display: 'block', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                      )}
                      {mediaType === 'video' && (
                        <Box sx={{ position: 'relative', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden' }}>
                          <ReactPlayer 
                            url={media.url}
                            controls 
                            width='100%'
                            height='100%'
                            // Play only if it's the current slide AND the card is in view
                            playing={index === currentSlide && inView} 
                            muted={true} // Keep muted for autoplay
                            style={{ position: 'absolute', top: 0, left: 0 }}
                          />
                        </Box>
                      )}
                       {mediaType === 'audio' && (
                         <audio controls src={media.url} style={{ width: '100%', display: 'block' }}> {/* Access media.url */}
                            {t('post.audioUnsupported', 'Your browser does not support the audio tag.')}
                         </audio>
                       )}
                    </div>
                  );
                })}
              </Slider>
            ) : null /* No valid media to display */}
          </Box>
        )}

        {/* Post Actions/Stats - Using Buttons like HomePage - Moved back inside CardContent */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
           <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<Heart size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' } }}>
              {post.likesCount}
            </Button>
            <Button size="small" startIcon={<ChatDots size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
              {post.commentsCount}
            </Button>
            {/* Add Share button if needed */}
            {/* <Button size="small" startIcon={<ShareNetwork size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.08) } }}>
              Share
            </Button> */}
          </Stack>
          {/* Removed the Bookmark IconButton */}
          {/* <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <BookmarkSimple size={18} />
          </IconButton> */}
        </Stack>
      </CardContent>
      {/* Removed CardActions wrapper */}
    </Card>
  );
};

export default PostCard;
