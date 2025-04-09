import React, { useEffect, useState, useCallback, useRef } from 'react'; // Re-add useCallback, useRef
import {
  Alert,
  Box,
  // Button, // Removed unused import
  CircularProgress,
  Container,
  Divider, // Re-add Divider import
  Grid,
  // Paper, // Removed unused import
  Stack,
  Typography,
  // Avatar // Moved to ForumPostCard
  // Chip // Moved to ForumPostCard
 } from '@mui/material';
import { useTranslation } from 'react-i18next';
// import Breadcrumb from '../../app/components/Breadcrumb'; // Removed redundant Breadcrumb
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { useAppDispatch, useAppSelector } from '../../app/store/initStore'; // Import Redux hooks
// Import forum slice actions/selectors AND user API
import { fetchForumPosts, selectForumPosts, selectForumStatus, selectForumError, selectForumCurrentPage, selectForumTotalPages, fetchUserByUsername, User } from '@neurolink/shared';
import apiClient from '../../app/api/apiClient'; // Import apiClient
import { ForumPostDTO } from '@neurolink/shared/src/features/forum/types'; // Import type
import ForumPostCard from '../../features/forum/components/ForumPostCard'; // Import the new card component
// import { CaretDown } from '@phosphor-icons/react'; // Removed unused import

const ForumPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Selectors for forum state
  const posts = useAppSelector(selectForumPosts);
  const status = useAppSelector(selectForumStatus);
  const error = useAppSelector(selectForumError);
  const currentPage = useAppSelector(selectForumCurrentPage);
  const totalPages = useAppSelector(selectForumTotalPages);

  // Local state to store fetched user details (username -> User object)
  const [userDetails, setUserDetails] = useState<Record<string, User>>({});
  // const [userFetchStatus, setUserFetchStatus] = useState<'idle' | 'loading' | 'failed'>('idle'); // Removed unused state

  // Ref for the loading spinner at the bottom
  const observerRef = useRef<HTMLDivElement>(null);
  const isFetchingNextPage = useRef(false); // Prevent multiple fetches for the same page

  // Fetch initial posts on mount
  useEffect(() => {
    // Fetch only if idle (to avoid re-fetching on component re-renders unless needed)
    if (status === 'idle') {
      dispatch(fetchForumPosts({ apiClient, params: { page: 1, size: 10 } })); // Fetch page 1, size 10
    }
  }, [dispatch, status]); // Dependency array includes dispatch and status

  // Effect to fetch user details when posts change
  useEffect(() => {
    if (status === 'succeeded' && posts.length > 0) {
      const usernamesToFetch = posts
        .map(post => post.username)
        .filter((username, index, self) =>
          self.indexOf(username) === index && !userDetails[username] // Unique and not already fetched
        );

      if (usernamesToFetch.length > 0) {
        // setUserFetchStatus('loading'); // Removed state update
        Promise.all(
          usernamesToFetch.map(username =>
            fetchUserByUsername(apiClient, username)
              .catch(err => {
                console.error(`Failed to fetch user ${username}:`, err);
                return null; // Return null on error for this user
              })
          )
        ).then(results => {
          const newUserDetails: Record<string, User> = {};
          results.forEach(user => {
            if (user) newUserDetails[user.username] = user;
          });
          setUserDetails(prev => ({ ...prev, ...newUserDetails }));
          // setUserFetchStatus('idle'); // Removed state update
        });
      }
    }
  }, [posts, status, userDetails]); // Depend on posts, status, and userDetails

  // Callback for IntersectionObserver
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (
        target.isIntersecting &&
        status !== 'loading' && // Ensure not already loading globally
        !isFetchingNextPage.current && // Ensure not already fetching the next page
        currentPage < totalPages
       ) {
      isFetchingNextPage.current = true; // Mark as fetching
      const nextPage = currentPage + 1;
      dispatch(fetchForumPosts({ apiClient, params: { page: nextPage, size: 10 } }))
        .finally(() => {
            isFetchingNextPage.current = false; // Reset after fetch completes (success or fail)
        });
    }
  }, [status, currentPage, totalPages, dispatch]);

  // Effect for IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null, // Use the viewport
      rootMargin: '0px',
      threshold: 0.5 // Trigger when 50% of the last item is visible
    });

    const currentObserverRef = observerRef.current; // Capture ref value
    if (currentObserverRef) observer.observe(currentObserverRef);

    return () => { // Cleanup
      if (currentObserverRef) observer.unobserve(currentObserverRef);
    };
  }, [handleObserver]); // Re-run if handleObserver changes


  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> {/* Changed maxWidth to md */}
      {/* <Breadcrumb customItems={breadcrumbItems} />  Removed */}
      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid item xs={12}>
          {/* Removed outer Paper wrapper */}
            <AccessibleTypography variant="h4" component="h1" gutterBottom>
              {t('forum.title', 'Community Forum')}
            </AccessibleTypography>
            <AccessibleTypography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('forum.description', 'Discuss topics, ask questions, and connect with others.')}
            </AccessibleTypography>
            {/* Conditional Rendering based on status */}
            {status === 'loading' && currentPage === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
              </Box>
            )}

            {status === 'failed' && (
              <Alert severity="error" sx={{ mb: 2 }}>{error || t('common.error', 'Error')}</Alert>
            )}

            {/* Render posts if succeeded or loading more */}
            {(status === 'succeeded' || (status === 'loading' && currentPage > 0)) && ( // Keep outer check
              <Stack
                divider={<Divider flexItem />} // Add dividers between items
                spacing={0} // Remove spacing, divider handles it
              >
                 {posts.length === 0 && status === 'succeeded' && (
                   <AccessibleTypography color="text.secondary" align="center" sx={{ py: 4 }}>
                     {t('forum.noPosts', 'No forum posts found yet.')}
                   </AccessibleTypography>
                )}
                {posts.map((post: ForumPostDTO, index: number) => {
                  // Attach ref to the last post card
                  const isLastPost = index === posts.length - 1;
                  const user = userDetails[post.username]; // Get user details from state
                  return (
                    <ForumPostCard
                      key={post.id}
                      post={post}
                      displayName={user?.displayName}
                      profilePicture={user?.profilePicture}
                      ref={isLastPost ? observerRef : null} // Ref placed correctly before closing tag
                    />
                  );
                })}
              </Stack>
            )}

            {/* Loading More Spinner */}
            {status === 'loading' && currentPage > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}> {/* Ref moved to last post card */}
                <CircularProgress size={30} />
              </Box>
            )}

             {/* End of List Indicator */}
            {status === 'succeeded' && posts.length > 0 && currentPage === totalPages && (
              <Box sx={{ textAlign: 'center', mt: 3, mb: 1 }}>
                <Typography color="text.secondary" variant="caption">
                  {t('forum.endOfPosts', "You've reached the end.")}
                </Typography>
              </Box>
            )}
          {/* Removed outer Paper wrapper */}
        </Grid>
        {/* Optional Sidebar Area */}
        {/*
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: NAVBAR_HEIGHT + 24, borderRadius: '12px' }}>
            <Typography variant="h6" gutterBottom>
              {t('forum.sidebar.title', 'Forum Tools')}
            </Typography>
            { // Add sidebar content like create post button, filters etc. }
          </Paper>
        </Grid>
        */}
      </Grid>
    </Container>
  );
};

export default ForumPage;