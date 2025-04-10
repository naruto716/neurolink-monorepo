import React, { useEffect, useState } from 'react'; // Removed unused useCallback
import { useParams } from 'react-router-dom'; // Removed unused useNavigate
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Avatar,
  TextField,
  Button,
  Chip,
  alpha,
  IconButton, // Add IconButton
} from '@mui/material';
import { Heart } from '@phosphor-icons/react'; // Import Heart icon
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Import rehype-raw

import { useAppDispatch, useAppSelector } from '../../app/store/initStore';
import {
  fetchPostById,
  // fetchComments, // Not used directly for now (pagination deferred)
  createComment,
  clearSelectedPost,
  selectSelectedPost,
  selectSelectedPostStatus,
  selectSelectedPostError,
  selectPostComments,
  selectCommentsStatus,
  selectCommentsError,
  // selectCommentsCurrentPage, // Not used
  // selectCommentsTotalPages, // Not used
  selectCreateCommentStatus,
  selectCreateCommentError,
  CommentResponseDTO,
  fetchUserByUsername,
  User,
  likePost, // Import likePost thunk
  selectLikeStatus, // Import like status selector
  // selectLikeError, // Error handled via toast for now
} from '@neurolink/shared';
import apiClient from '../../app/api/apiClient';
// import Breadcrumb from '../../app/components/Breadcrumb'; // Removed Breadcrumb
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { toast } from 'react-toastify';

const ForumPostDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { postId } = useParams<{ postId: string }>(); // Ensure postId is treated as potentially undefined later
// Removed unused navigate variable
  const dispatch = useAppDispatch();

  const post = useAppSelector(selectSelectedPost);
  const postStatus = useAppSelector(selectSelectedPostStatus);
  const postError = useAppSelector(selectSelectedPostError);
  const comments = useAppSelector(selectPostComments);
  const commentsStatus = useAppSelector(selectCommentsStatus);
  const commentsError = useAppSelector(selectCommentsError);
  // const commentsCurrentPage = useAppSelector(selectCommentsCurrentPage); // Not used
  // const commentsTotalPages = useAppSelector(selectCommentsTotalPages); // Not used
  const createCommentStatus = useAppSelector(selectCreateCommentStatus);
  const createCommentError = useAppSelector(selectCreateCommentError);
  const likeStatus = useAppSelector(selectLikeStatus);

  const [newComment, setNewComment] = useState('');
  const [commentUserDetails, setCommentUserDetails] = useState<Record<string, User>>({});
  const [postUserDetails, setPostUserDetails] = useState<User | null>(null);

  // Fetch post details on mount or when postId changes
  useEffect(() => {
    if (postId) {
      dispatch(fetchPostById({ apiClient, postId }));
    }
    // Cleanup function to clear the selected post when the component unmounts or postId changes
    return () => {
      dispatch(clearSelectedPost());
    };
  }, [dispatch, postId]);

  // Fetch user details for the post author
  useEffect(() => {
    // Add null check for post
    if (post?.username && !postUserDetails) {
      fetchUserByUsername(apiClient, post.username)
        .then((user: User) => setPostUserDetails(user)) // Add type for user
        .catch(err => console.error(`Failed to fetch post author ${post?.username}:`, err)); // Add null check
    }
  }, [post, postUserDetails]);


  // Fetch user details for comment authors
  useEffect(() => {
    // Ensure comments is an array before processing
    if (Array.isArray(comments) && comments.length > 0) {
      const usernamesToFetch = comments
        .map((comment: CommentResponseDTO) => comment.username) // Use CommentResponseDTO
        .filter((username: string, index: number, self: string[]) => // Add types
          self.indexOf(username) === index && !commentUserDetails[username] // Add null check for commentUserDetails
        );

      if (usernamesToFetch.length > 0) {
        Promise.all(
          usernamesToFetch.map((username: string) => // Add type
            fetchUserByUsername(apiClient, username)
              .catch(err => {
                console.error(`Failed to fetch comment author ${username}:`, err);
                return null;
              })
          )
        ).then(results => {
          const newUserDetails: Record<string, User> = {};
          results.forEach((user: User | null) => { // Add type
            if (user) newUserDetails[user.username] = user;
          });
          setCommentUserDetails(prev => ({ ...prev, ...newUserDetails }));
        });
      }
    }
  }, [comments, commentUserDetails]);


  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postId || !newComment.trim()) {
      toast.error(t('forum.detail.commentEmptyError'));
      return;
    }

    // Ensure postId exists before dispatching
    if (!postId) return;
    dispatch(createComment({ apiClient, postId, commentData: { content: newComment.trim() } })) // Correct args
      .unwrap()
      .then(() => {
        setNewComment(''); // Clear input on success
        toast.success(t('forum.detail.commentSuccess'));
      })
      .catch(() => {
        toast.error(createCommentError ?? t('forum.detail.commentError')); // Use nullish coalescing
      });
  };

  const handleLikeClick = () => {
    if (!postId || likeStatus === 'loading') {
      return; // Prevent liking if no postId or already liking
    }
    dispatch(likePost({ apiClient, postId }))
      .unwrap()
      .then(() => {
        // Optimistic update handled in reducer, maybe show a subtle confirmation?
        // toast.success(t('forum.detail.likeSuccess')); // Optional success toast
      })
      .catch((error) => {
        // Error should ideally be specific from the API/thunk
        toast.error(error?.message || t('forum.detail.likeError'));
      });
  };

  // TODO: Implement comment pagination if needed
  // const loadMoreComments = () => {
  //   if (postId && commentsStatus !== 'loading' && commentsCurrentPage < commentsTotalPages) {
  //     const nextPage = commentsCurrentPage + 1;
  //     dispatch(fetchComments({ apiClient, postId, params: { page: nextPage } }));
  //   }
  // };

  if (postStatus === 'loading' && !post) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (postStatus === 'failed') {
    return (
      <Container maxWidth="md" sx={{ my: 3 }}>
        <Alert severity="error">{postError ?? t('forum.detail.loadError')}</Alert>
      </Container>
    );
  }

  if (!post) {
    // Should ideally be handled by the failed status, but as a fallback
    return (
      <Container maxWidth="md" sx={{ my: 3 }}>
        <Alert severity="warning">{t('forum.detail.notFound')}</Alert>
      </Container>
    );
  }

  // Removed breadcrumbItems definition

  return (
    <Container maxWidth="md" sx={{ my: 3 }}>
      {/* <Breadcrumb customItems={breadcrumbItems} /> */} {/* Removed Breadcrumb component */}
      <Box sx={{ my: 3 }}>
        {/* Post Header */}
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <Avatar
            src={postUserDetails?.profilePicture || undefined}
            sx={{ width: 32, height: 32 }}
          >
            {!postUserDetails?.profilePicture ? (postUserDetails?.displayName || post.username)?.charAt(0).toUpperCase() : null}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {postUserDetails?.displayName || post.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(post.created_at).toLocaleString()}
            </Typography>
          </Box>
        </Stack>

        {/* Title */}
        <AccessibleTypography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mt: 2 }}>
          {post.title}
        </AccessibleTypography>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {post.tags.map((tag: string) => ( // Add type for tag
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        )}



        {/* Divider removed from here */}

        {/* Content */}
        <Box className="markdown-content" sx={{
          '& p': { mb: 1.5 },
          '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2.5, mb: 1 },
          '& ul, & ol': { pl: 2.5, mb: 1.5 },
          '& blockquote': { borderLeft: '4px solid', borderColor: 'divider', pl: 1.5, ml: 0, fontStyle: 'italic', color: 'text.secondary' },
          '& code': { bgcolor: theme => alpha(theme.palette.primary.light, 0.1), px: 0.5, borderRadius: 1, fontSize: '0.9em' },
          '& pre > code': { display: 'block', p: 1, overflowX: 'auto' },
          '& img': { maxWidth: '100%', height: 'auto', display: 'block', my: 1.5, borderRadius: '8px' },
          // Add video styling
          '& video': { maxWidth: '100%', height: 'auto', display: 'block', my: 1.5, borderRadius: '8px' },
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{post.content || ''}</ReactMarkdown>
        </Box>

        {/* Like Button - Moved below content */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}> {/* Adjusted margin */}
           <IconButton
             onClick={handleLikeClick}
             disabled={likeStatus === 'loading'}
             color="error"
             aria-label={t('forum.detail.likeAriaLabel', 'Like post')}
           >
             <Heart size={20} weight="bold" />
           </IconButton>
           <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
             {post.likes ?? 0}
           </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Comments Section */}
        <AccessibleTypography variant="h5" component="h2" gutterBottom>
          {t('forum.detail.commentsTitle', { count: post.comments_count ?? 0 })}
        </AccessibleTypography>

        {/* Comment Input Form */}
        <Box component="form" onSubmit={handleCommentSubmit} sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder={t('forum.detail.commentPlaceholder')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={createCommentStatus === 'loading'}
            multiline
            maxRows={4} // Allow some expansion
          />
          <Button
            type="submit"
            variant="contained"
            disabled={createCommentStatus === 'loading' || !newComment.trim()}
            sx={{ flexShrink: 0 }} // Prevent button from shrinking
          >
            {createCommentStatus === 'loading' ? <CircularProgress size={24} /> : t('forum.detail.commentSubmit')}
          </Button>
        </Box>
        {createCommentError && <Alert severity="error" sx={{ mb: 2 }}>{createCommentError}</Alert>}


        {/* Comments List */}
        <Stack spacing={2} divider={<Divider />}>
          {commentsStatus === 'loading' && (!comments || comments.length === 0) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {commentsError && (
            <Alert severity="error">{commentsError ?? 'Unknown error'}</Alert>
          )}
          {(!comments || comments.length === 0) && commentsStatus === 'succeeded' && (
             <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
               {t('forum.detail.noComments')}
             </Typography>
          )}
          {/* Ensure comments is an array before mapping */}
          {Array.isArray(comments) && comments.map((comment: CommentResponseDTO) => { // Use CommentResponseDTO
             const user = commentUserDetails[comment.username];
             return (
                <Box key={comment.id} sx={{ py: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                    <Avatar
                      src={user?.profilePicture || undefined}
                      sx={{ width: 28, height: 28 }}
                    >
                      {!user?.profilePicture ? (user?.displayName || comment.username).charAt(0).toUpperCase() : null}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user?.displayName || comment.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" sx={{ pl: '44px' }}> {/* Indent comment text */}
                    {comment.content}
                  </Typography>
                </Box>
             );
          })}
          {/* TODO: Add Load More Button if pagination is implemented */}
          {/* {commentsStatus !== 'loading' && commentsCurrentPage < commentsTotalPages && (
            <Button onClick={loadMoreComments}>Load More Comments</Button>
          )} */}
        </Stack>
      </Box>
    </Container>
  );
};

export default ForumPostDetailPage;