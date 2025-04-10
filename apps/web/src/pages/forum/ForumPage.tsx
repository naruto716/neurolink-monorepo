import React, { useEffect, useState, useCallback, useRef } from 'react'; // Re-add useCallback, useRef
import {
  Alert,
  Box,
  Button, // Add Button import
  CircularProgress,
  Container,
  Divider, // Re-add Divider import
  Grid,
  // Paper, // Removed unused import
  Stack,
  Typography,
  TextField, // Add TextField
  Autocomplete, // Add Autocomplete
  Chip, // Add Chip for tag rendering
 } from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // Import AddIcon
import { Link as RouterLink } from 'react-router-dom'; // Import Link for navigation
import { useTranslation } from 'react-i18next';
// import Breadcrumb from '../../app/components/Breadcrumb'; // Removed redundant Breadcrumb
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { useAppDispatch, useAppSelector } from '../../app/store/initStore'; // Import Redux hooks
// Import forum slice actions/selectors AND user API
import { fetchForumPosts, selectForumPosts, selectForumStatus, selectForumError, selectForumCurrentPage, selectForumTotalPages, fetchUserByUsername, User, fetchForumTags, selectForumTags, TagResponseDTO, FetchForumPostsParams } from '@neurolink/shared'; // Use fetchForumTags
import apiClient from '../../app/api/apiClient'; // Import apiClient
import { PostResponseDTO } from '@neurolink/shared/src/features/forum/types'; // Import type (renamed from ForumPostDTO)
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
  const [attemptedUsernames, setAttemptedUsernames] = useState<Set<string>>(new Set()); // Track attempted fetches
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<TagResponseDTO[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Selectors for tags
  const availableTags = useAppSelector(selectForumTags);
  const tagsStatus = useAppSelector(state => state.forum.tagsStatus); // Use direct state access if selector not exported/needed elsewhere

  // Ref for the loading spinner at the bottom
  const observerRef = useRef<HTMLDivElement>(null);
  const isFetchingNextPage = useRef(false);
  // const initialFetchDone = useRef(false); // Removed unused ref

  // Fetch initial posts and tags
  useEffect(() => {
    // Fetch posts only if status is idle (initial load)
    if (status === 'idle') {
      dispatch(fetchForumPosts({ apiClient, params: { page: 1, size: 10 } }));
    }
    // Fetch tags if not already fetched/loading
    if (tagsStatus === 'idle') {
      dispatch(fetchForumTags({ apiClient })); // Use renamed thunk
    }
    // Intentionally only run on mount for initial data load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Effect to fetch user details when posts change
  useEffect(() => {
    if (status === 'succeeded' && posts.length > 0) {
      const usernamesToFetch = posts
        .map(post => post.username)
        .filter((username, index, self) =>
          self.indexOf(username) === index && // Unique username in the current posts batch
          !userDetails[username] && // Not already successfully fetched
          !attemptedUsernames.has(username) // Not already attempted
        );

      if (usernamesToFetch.length > 0) {
        // Mark these usernames as attempted immediately
        setAttemptedUsernames(prev => new Set([...prev, ...usernamesToFetch]));
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
  }, [posts, status, userDetails, attemptedUsernames]); // Add attemptedUsernames to dependencies

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Effect to refetch posts when debounced search term or filter tags change
  useEffect(() => {
    // Don't refetch on initial mount if searchTerm and filterTags are empty
    if (debouncedSearchTerm === '' && filterTags.length === 0 && status !== 'idle') {
       // If filters cleared and not initial load, refetch page 1
       if (currentPage !== 1 || status === 'succeeded') { // Avoid refetch if already loading page 1
           dispatch(fetchForumPosts({ apiClient, params: { page: 1, size: 10 } }));
       }
       return;
    }

    // Trigger fetch only if search term or tags are present
    if (debouncedSearchTerm !== '' || filterTags.length > 0) {
        const params: FetchForumPostsParams = { page: 1, size: 10 }; // Use specific type
        if (debouncedSearchTerm) {
            params.search = debouncedSearchTerm;
        }
        if (filterTags.length > 0) {
            params.tags = filterTags.map(tag => tag.name); // Send tag names
        }
        dispatch(fetchForumPosts({ apiClient, params }));
    }
    // Intentionally exclude 'status' and 'currentPage' to only trigger on filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filterTags, dispatch]);


  // Callback for IntersectionObserver (Infinite Scroll)
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (
        target.isIntersecting &&
        status !== 'loading' &&
        !isFetchingNextPage.current &&
        currentPage < totalPages
       ) {
      isFetchingNextPage.current = true;
      const nextPage = currentPage + 1;
      // Include current filters in pagination fetch
      const params: FetchForumPostsParams = { page: nextPage, size: 10 }; // Use specific type
      if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
      }
      if (filterTags.length > 0) {
          params.tags = filterTags.map(tag => tag.name);
      }
      dispatch(fetchForumPosts({ apiClient, params }))
        .finally(() => {
            isFetchingNextPage.current = false;
        });
    }
  }, [status, currentPage, totalPages, dispatch, debouncedSearchTerm, filterTags]); // Add filter dependencies

  // Effect for setting up IntersectionObserver
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <AccessibleTypography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
                {t('forum.title', 'Community Forum')}
              </AccessibleTypography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/forum/create"
              >
                {t('forum.createPost.breadcrumb', 'Create Post')} {/* Reuse translation */}
              </Button>
            </Box>
            <AccessibleTypography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('forum.description', 'Discuss topics, ask questions, and connect with others.')}
            </AccessibleTypography>

            {/* Search and Filter Inputs */}
            {/* Wrap Stack in Box with maxWidth */}
            <Box sx={{ maxWidth: { sm: '100%', md: '100%' }, mb: 3, mx: 'auto', px: 1 }}> {/* Center the box */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
              <TextField
                // fullWidth // Remove fullWidth
                variant="outlined"
                size="small"
                label={t('forum.searchLabel', 'Search posts...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                // Use sx to control width/flexibility
                sx={{ width: { xs: '100%', sm: 'auto' }, flexGrow: 1 }} // Let it grow within the constrained Box
              />
              {/* Tag Filter Autocomplete - Needs tag fetching logic */}
              <Autocomplete
                multiple
                id="forum-filter-tags"
                options={availableTags || []} // Use fetched tags
                getOptionLabel={(option) => option.name}
                value={filterTags}
                onChange={(event, newValue) => {
                  setFilterTags(newValue);
                }}
                loading={tagsStatus === 'loading'} // Use tagsStatus
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    label={t('forum.filterTagsLabel', 'Filter by tags')}
                    // placeholder={t('forum.filterTagsPlaceholder', 'Select tags...')}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} />
                  ))
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }}
              />
            </Stack>
          </Box> {/* Close the wrapping Box */}
            {/* Removed misplaced closing tag */}
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
                divider={<Divider flexItem />}
                spacing={1} // Add spacing between cards
              >
                 {posts.length === 0 && status === 'succeeded' && (
                   <AccessibleTypography color="text.secondary" align="center" sx={{ py: 4 }}>
                     {t('forum.noPosts', 'No forum posts found yet.')}
                   </AccessibleTypography>
                )}
                {posts.map((post: PostResponseDTO, index: number) => { // Use correct type here
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