import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'; // Added useState, useRef, useCallback
import { Alert, Typography, Stack, Box, CircularProgress } from '@mui/material'; // Added Box, CircularProgress
import PostCardSkeleton from './PostCardSkeleton';
import {
  useAppDispatch,
  useAppSelector,
  RootState, // Import RootState for selector typing
} from '../../../app/store/initStore';
import apiClient from '../../../app/api/apiClient';
import {
  fetchFeedPostsThunk,
  selectFeedPosts,
  selectFeedPostsStatus,
  selectFeedPostsError,
  selectFeedCurrentUsernameFilters,
  selectFeedPostsCurrentPage, // Added selector for current page
  selectFeedPostsTotalPages, // Added selector for total pages
  Post, // Need Post type for state
  selectCurrentUser, // Import current user selector
} from '@neurolink/shared';
// Import the selectors for suggested users from the correct slice path
import {
  selectPaginatedUsers as selectSharedPaginatedUsers,
  selectPaginatedUsersStatus as selectSharedPaginatedUsersStatus,
} from '@neurolink/shared/src/features/user/paginatedUsersSlice';
import PostCard from './PostCard';
import { useTranslation } from 'react-i18next';

// Wrapper selectors using the web app's RootState
const selectPaginatedUsers = (state: RootState) => selectSharedPaginatedUsers(state);
const selectPaginatedUsersStatus = (state: RootState) => selectSharedPaginatedUsersStatus(state);


const FeedPosts: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // --- State for Infinite Scroll ---
  const [allFeedPosts, setAllFeedPosts] = useState<Post[]>([]); // Accumulate posts here
  const isLoadingMorePosts = useRef(false);
  const postsObserver = useRef<IntersectionObserver | null>(null);
  const isInitialUsernameFetch = useRef(true); // Track if it's the first fetch for current usernames

  // --- Redux State ---
  // Suggestions
  const suggestedUsers = useAppSelector(selectPaginatedUsers);
  const suggestionsStatus = useAppSelector(selectPaginatedUsersStatus);
  // Current User
  const currentUser = useAppSelector(selectCurrentUser);
  // Feed Posts (from Redux, represents the *last fetched page*)
  const latestFeedPostsPage = useAppSelector(selectFeedPosts);
  const feedStatus = useAppSelector(selectFeedPostsStatus);
  const feedError = useAppSelector(selectFeedPostsError);
  const currentFeedUsernames = useAppSelector(selectFeedCurrentUsernameFilters);
  const feedCurrentPage = useAppSelector(selectFeedPostsCurrentPage);
  const feedTotalPages = useAppSelector(selectFeedPostsTotalPages);
  // --- End Redux State ---

  // Combine suggested usernames with the current user's username
  const usernamesToFetch = useMemo(() => {
    const names = new Set<string>();
    // Add current user's username if available
    if (currentUser?.username) {
      names.add(currentUser.username);
    }
    // Add suggested usernames if loaded
    if (suggestionsStatus === 'succeeded' && suggestedUsers.length > 0) {
      suggestedUsers.forEach((user) => names.add(user.username));
    }
    return Array.from(names);
  }, [suggestedUsers, suggestionsStatus, currentUser?.username]); // Depend on current user's username

  // --- Fetching Logic ---
  const triggerPostFetch = useCallback((page: number, isNewUsernameSet: boolean = false) => {
    // Use the combined list
    if (usernamesToFetch.length === 0) return;

    console.log(`Triggering post fetch - Page: ${page}, NewUsernames: ${isNewUsernameSet}, Usernames: ${usernamesToFetch.join(',')}`);

    if (isNewUsernameSet) {
      isInitialUsernameFetch.current = true; // Mark as initial fetch for these usernames
      // No need to clear Redux state here, the thunk handles it implicitly on page 1? Or should we? Let's assume thunk handles it.
    } else {
      isLoadingMorePosts.current = true; // Loading *more* posts
    }

    dispatch(
      fetchFeedPostsThunk({
        apiClient,
        usernames: usernamesToFetch, // Pass the combined list
        pageNumber: page,
        pageSize: 10, // Keep page size consistent
      })
    );
  }, [dispatch, usernamesToFetch, apiClient]); // Update dependency

  // Effect to fetch page 1 when the list of usernames to fetch changes
  useEffect(() => {
    // Only fetch if usernames are available and different from the last set used for fetching
    // Compare the calculated usernamesToFetch with the usernames stored in the Redux state from the last successful fetch
    const usernamesActuallyFetched = currentFeedUsernames || []; // Use empty array if undefined
    // Create copies before sorting to avoid mutating state/props
    const stringifiedUsernamesToFetch = JSON.stringify([...usernamesToFetch].sort());
    const stringifiedUsernamesActuallyFetched = JSON.stringify([...usernamesActuallyFetched].sort());

    const usernamesChanged = stringifiedUsernamesToFetch !== stringifiedUsernamesActuallyFetched;

    // Fetch if we have usernames AND (the list changed OR it's the initial idle state)
    if (usernamesToFetch.length > 0 && (usernamesChanged || feedStatus === 'idle')) {
        console.log("Usernames to fetch changed or initial load, fetching page 1.");
        setAllFeedPosts([]); // Clear existing posts when usernames change
        isLoadingMorePosts.current = false; // Reset loading more flag
        triggerPostFetch(1, true); // Fetch page 1, mark as new username set
    } else if (usernamesToFetch.length === 0 && suggestionsStatus === 'succeeded') {
        // This case might need refinement - if suggestions load but are empty,
        // we still might want to show the current user's posts if they exist.
        // However, the current logic clears posts if usernamesToFetch is empty.
        console.log("No usernames (including current user) to fetch posts for.");
        setAllFeedPosts([]); // Clear posts if the final list is empty
    }
    // Dependency includes the calculated list and the trigger function
  }, [usernamesToFetch, triggerPostFetch, currentFeedUsernames, feedStatus, suggestionsStatus]);

  // Effect to update local state when Redux state changes (new page loaded)
  useEffect(() => {
    if (feedStatus === 'succeeded') {
      console.log(`Feed status succeeded. Current Page: ${feedCurrentPage}, InitialFetch: ${isInitialUsernameFetch.current}`);
      if (isInitialUsernameFetch.current || feedCurrentPage === 1) {
        console.log("Setting initial posts:", latestFeedPostsPage);
        setAllFeedPosts(latestFeedPostsPage);
        isInitialUsernameFetch.current = false; // Mark initial fetch as done
      } else {
        console.log("Appending new posts:", latestFeedPostsPage);
        setAllFeedPosts(prev => {
          const existingIds = new Set(prev.map(post => post.id));
          const newPosts = latestFeedPostsPage.filter(post => !existingIds.has(post.id));
          return [...prev, ...newPosts];
        });
      }
      isLoadingMorePosts.current = false; // Done loading more
    } else if (feedStatus === 'failed') {
      isLoadingMorePosts.current = false; // Reset on error too
    }
  }, [latestFeedPostsPage, feedStatus, feedCurrentPage]); // Depend on the fetched page data and status

  // --- Intersection Observer Logic ---
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (feedStatus === 'loading' || isLoadingMorePosts.current) return; // Don't observe if already loading
    if (postsObserver.current) postsObserver.current.disconnect(); // Disconnect old observer

    postsObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && feedCurrentPage < feedTotalPages) {
        console.log('Intersection observer triggered: Fetching next page');
        triggerPostFetch(feedCurrentPage + 1); // Fetch next page
      }
    }, { threshold: 0.8 }); // Trigger when 80% visible

    if (node) postsObserver.current.observe(node); // Observe the new node
  }, [feedStatus, isLoadingMorePosts, feedCurrentPage, feedTotalPages, triggerPostFetch]); // Dependencies

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (postsObserver.current) {
        postsObserver.current.disconnect();
      }
    };
  }, []);
  // --- End Infinite Scroll Logic ---



  // --- Render Logic ---

  // Initial Loading Skeletons (before any posts are loaded for current usernames)
  if ((feedStatus === 'loading' && allFeedPosts.length === 0) || suggestionsStatus === 'loading') {
    return (
      <Stack spacing={3}>
        {[...Array(3)].map((_, index) => (
          <PostCardSkeleton key={`skeleton-${index}`} />
        ))}
      </Stack>
    );
  }


  // Error States
  if (suggestionsStatus === 'failed') {
      return <Alert severity="warning">{t('social.suggestionsError', 'Could not load user suggestions.')}</Alert>;
  }

  // Show feed error only if not currently loading more (avoid showing error during load more)
  if (feedStatus === 'failed' && !isLoadingMorePosts.current) {
    return <Alert severity="error">{t('social.feedError', 'Error loading posts:')} {feedError}</Alert>;
  }


  // Empty States
  // Refined empty state: Check if suggestions loaded AND the final list (including current user) is empty
  if (suggestionsStatus === 'succeeded' && usernamesToFetch.length === 0) {
      return (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 3 }}>
              {/* Maybe a different message if only current user has no posts? */}
              {t('social.noUsersForFeed', 'No users available to build feed.')}
          </Typography>
      );
  }

  if (feedStatus === 'succeeded' && allFeedPosts.length === 0 && !isLoadingMorePosts.current) {
    return (
      <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 3 }}>
        {t('social.noPostsEncouragement', 'No posts yet. Be the first to share something!')}
      </Typography>
    );
  }


  // Render Accumulated Posts
  return (
    <Stack spacing={3}>
      {allFeedPosts.map((post, index) => {
        // Attach observer ref to an element near the end of the list
        // e.g., the 3rd to last item, or the first item if list is short
        const attachObserver = allFeedPosts.length >= 3
            ? index === allFeedPosts.length - 3
            : index === 0 && allFeedPosts.length > 0;

        return (
          <Box key={post.id} ref={attachObserver ? lastPostElementRef : null}>
            <PostCard post={post} />
          </Box>
        );
      })}

      {/* Loading More Indicator */}
      {isLoadingMorePosts.current && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={30} />
        </Box>
      )}

      {/* End of Feed Indicator - Moved to SocialPage */}
    </Stack>
  );

};

export default FeedPosts;