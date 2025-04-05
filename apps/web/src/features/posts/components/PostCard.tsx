import React, { useState } from 'react';
// Removed Paper
import { Card, CardContent, Box, alpha, useTheme, Typography, Stack, Avatar, IconButton, Button, Divider, TextField, CircularProgress, Pagination } from '@mui/material'; 
import { Post, Comment, fetchComments, PaginatedCommentsResponse } from '@neurolink/shared';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import { formatDistanceToNow } from 'date-fns';
// Import icons used in HomePage's PostCard - Removed ShareNetwork and BookmarkSimple
import { ChatDots, Heart, DotsThree, PaperPlaneTilt } from '@phosphor-icons/react'; 
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

// Import the actual API client
import apiClient from '../../../app/api/apiClient';

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

// Simple component to display a single comment
interface CommentItemProps {
  comment: Comment;
}
const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  // TODO: Fetch author details (name, avatar) based on comment.authorId if needed
  // For now, just display authorId and content
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <Stack direction="row" spacing={1.5} sx={{ py: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32 }} /> {/* Placeholder Avatar */}
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <AccessibleTypography variant="body2" sx={{ fontWeight: 600 }}>
            Author {comment.authorId} {/* Placeholder Author Name */}
          </AccessibleTypography>
          <Typography variant="caption" color="text.secondary">
            {timeAgo}
          </Typography>
        </Stack>
        <AccessibleTypography variant="body2" sx={{ mt: 0.5 }}>
          {comment.content}
        </AccessibleTypography>
      </Box>
    </Stack>
  );
};

const PostCard: React.FC<PostCardProps> = ({ post, authorDisplayName, authorProfilePicture }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  // State to track current slide
  const [currentSlide, setCurrentSlide] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0.5, // Trigger when 50% of the card is visible
    triggerOnce: false, // Observe continuously
  });

  // Comment State
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsData, setCommentsData] = useState<PaginatedCommentsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

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

  // --- Comment Logic ---
  const COMMENTS_PER_PAGE = 5;

  const loadComments = async (page: number = 1) => {
    // Use apiClient directly
    if (!apiClient) { // Keep a basic guard, though apiClient should exist
      console.error("API client is not available.");
      setCommentError(t('post.commentsError', 'Failed to load comments.'));
      return;
    }
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const data = await fetchComments(apiClient, post.id, page, COMMENTS_PER_PAGE);
      setCommentsData(data);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setCommentError(t('post.commentsError', 'Failed to load comments.'));
      setCommentsData(null);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && !commentsData) { // Load comments only when opening for the first time
      loadComments(1);
    }
  };
  
  const handleCommentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommentInput(event.target.value);
  };

  const handleSendComment = () => {
    // Use apiClient directly
    if (!commentInput.trim() || !apiClient) { 
      if(!apiClient) console.error("API client is not available, cannot send comment.");
      return;
    }
    console.log("Sending comment:", commentInput);
    // TODO: Implement actual API call using createComment(apiClient, ...) 
    alert('Comment sending not implemented yet.');
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    loadComments(page);
  };
  // --- End Comment Logic ---

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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
           <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<Heart size={18} />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' } }}>
              {post.likesCount}
            </Button>
            {/* Updated Comments Button */}
            <Button 
              size="small" 
              startIcon={<ChatDots size={18} />} 
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
              onClick={toggleComments} // Toggle comments section
            >
              {post.commentsCount}
            </Button>
          </Stack>
        </Stack>

        {/* ----- Comment Section ----- */} 
        {commentsOpen && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            {/* New Comment Input */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }} /> {/* Current User Avatar Placeholder */}
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder={t('post.addCommentPlaceholder', 'Add a comment...')}
                value={commentInput}
                onChange={handleCommentInputChange}
                InputProps={{
                  sx: { borderRadius: '20px' }, // Rounded corners
                  endAdornment: (
                    <IconButton 
                      size="small" 
                      onClick={handleSendComment} 
                      disabled={!commentInput.trim()} // Disable if input is empty
                      edge="end"
                    >
                      <PaperPlaneTilt size={20} weight="fill" />
                    </IconButton>
                  )
                }}
              />
            </Stack>

            {/* Loading State */}
            {isLoadingComments && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* Error State */}
            {commentError && (
              <Typography color="error" variant="body2" sx={{ textAlign: 'center', my: 2 }}>
                {commentError}
              </Typography>
            )}

            {/* Comment List */}
            {!isLoadingComments && !commentError && commentsData && commentsData.comments.length > 0 && (
              <Stack spacing={1} divider={<Divider flexItem />}>
                {commentsData.comments.map((comment: Comment) => (
                  <CommentItem key={comment.commentId} comment={comment} />
                ))}
              </Stack>
            )}
            
            {/* No Comments Message */}
            {!isLoadingComments && !commentError && commentsData && commentsData.comments.length === 0 && (
               <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 2 }}>
                 {t('post.noComments', 'No comments yet.')}
               </Typography>
            )}

            {/* Pagination */}
            {!isLoadingComments && !commentError && commentsData && commentsData.totalComments > COMMENTS_PER_PAGE && (
              <Stack alignItems="center" sx={{ mt: 2 }}>
                <Pagination 
                  count={Math.ceil(commentsData.totalComments / COMMENTS_PER_PAGE)}
                  page={currentPage}
                  onChange={handlePageChange}
                  size="small"
                  siblingCount={0} // Show fewer page numbers
                  boundaryCount={1} // Show first/last page numbers
                />
              </Stack>
            )}
          </Box>
        )}
        {/* ----- End Comment Section ----- */}
      </CardContent>
      {/* Removed CardActions wrapper */}
    </Card>
  );
};

export default PostCard;
