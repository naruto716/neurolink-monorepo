import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card, CardContent,
  Chip,
  CircularProgress,
  Container, Grid,
  IconButton,
  InputAdornment,
  MenuItem, // Removed Paper
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  createFilterOptions, // Added useTheme
  styled, // Added Select, MenuItem, SelectChangeEvent, InputAdornment, IconButton
  useTheme, // Added useTheme
  Skeleton // Added Skeleton
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store/initStore';
// Added icons
import {
  clearPaginatedUsers,
  fetchPaginatedUsers,
  selectPaginatedUsers,
  selectPaginatedUsersError,
  selectPaginatedUsersStatus,
  selectUsersCurrentPage,
  selectUsersTotalPages,
  setUsersFilters
} from '@neurolink/shared/src/features/user/paginatedUsersSlice';
import { CaretLeft, CaretRight, ChatText, MagnifyingGlass, User, UserPlus } from '@phosphor-icons/react'; // Removed X
import apiClient from '../../app/api/apiClient';
// Added Tag, FetchTagsParams, fetchTags, sendFriendRequest, selectCurrentUser
import { FetchUserTagsParams, ListedUser, Tag, fetchUserTags, selectCurrentUser, sendFriendRequest } from '@neurolink/shared'; // Use aliased FetchUserTagsParams
import { debounce } from 'lodash'; // Added debounce
import { toast } from 'react-toastify'; // Added toast
import { useChatContext } from 'stream-chat-react'; // Import Stream Chat context hook
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
// Removed duplicate import of useAppSelector

// --- Define Tag Categories (copied/adapted from Onboarding) ---
const tagCategories = [
  { type: 'programOfStudy', label: 'onboarding.programOfStudy' },
  { type: 'yearLevel', label: 'onboarding.yearLevel' },
  { type: 'neurodivergence', label: 'onboarding.neurodivergenceStatus' },
  { type: 'interest', label: 'onboarding.interests' },
  { type: 'skill', label: 'onboarding.skills' },
  { type: 'language', label: 'onboarding.languages' },
  { type: 'course', label: 'onboarding.courses' },
];
// Type for tag fetching status per category
type TagFetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

// --- Styled Components ---
// Removed unused FilterPaper styled component

// Removed unused FilterRow styled component

const TagsDisplayContainer = styled(Box)(({ theme }) => ({
  position: 'relative', // For arrow positioning
  marginBottom: theme.spacing(2),
  paddingLeft: theme.spacing(5), // Space for left arrow
  paddingRight: theme.spacing(5), // Space for right arrow
}));

// Create separate fade overlay components for cleaner implementation
// const TagContainerFadeOverlay = styled(Box)(({ theme, position }: { theme: Theme; position: 'left' | 'right' }) => ({
//   position: 'absolute',
//   top: 0,
//   bottom: 0,
//   width: theme.spacing(7),
//   zIndex: 1,
//   pointerEvents: 'none', // Allow clicks to pass through
//   ...(position === 'left' ? {
//     left: theme.spacing(5),
//     background: `linear-gradient(to right, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper}90 40%, transparent 100%)`,
//   } : {
//     right: theme.spacing(5),
//     background: `linear-gradient(to left, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper}90 40%, transparent 100%)`,
//   })
// }));

const TagsScrollArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  overflowX: 'auto',
  scrollBehavior: 'smooth',
  padding: theme.spacing(1, 0),
  '&::-webkit-scrollbar': {
    display: 'none', // Hide scrollbar
  },
  scrollbarWidth: 'none', // Hide scrollbar for Firefox
  '-ms-overflow-style': 'none', // Hide scrollbar for IE/Edge
}));

const ScrollArrowButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'transparent', // Changed to transparent
  '&:hover': {
    backgroundColor: theme.palette.background.paper + '50', // Semi-transparent on hover
  },
  zIndex: 2, // Above the fade gradient
}));

// Combined Input Container (similar to Onboarding)
const CombinedInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: theme.shape.borderRadius * 5, // Very round corners
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  paddingLeft: theme.spacing(1.5),
  height: '48px', // Make search bar shorter
  // No right padding needed as there's no button inside
  // marginBottom: theme.spacing(3), // Let FilterPaper handle margin
}));
// --- End Styled Components ---


// Enhanced UserCard component
const UserCard: React.FC<{ user: ListedUser }> = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { client } = useChatContext(); // Get Stream Chat client
    const currentUser = useAppSelector(selectCurrentUser); // Get logged-in user from Redux
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMessaging, setIsMessaging] = useState(false); // State for message button loading
    const MAX_TAGS_DISPLAYED = 5;

    // Filter and limit tags (prioritize skills/interests, then others)
    const prioritizedTags = [
        ...(user.tags?.filter(tag => ['skill', 'interest', 'programOfStudy'].includes(tag.type)) || []),
        ...(user.tags?.filter(tag => !['skill', 'interest', 'programOfStudy'].includes(tag.type)) || []),
    ].slice(0, MAX_TAGS_DISPLAYED);

    const handleConnectClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isConnecting) return;

        setIsConnecting(true);
        try {
            await sendFriendRequest(apiClient, user.username);
            toast.success(t('people.toast.requestSent', 'Friend request sent to {displayName}!', { displayName: user.displayName }));
            // Optionally disable button further or change its state/icon after success
        } catch (err) {
            const message = err instanceof Error ? err.message : t('people.error.sendRequestFailed', 'Failed to send friend request.');
            toast.error(message);
            console.error("Error sending friend request from PeoplePage:", err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleViewProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        navigate(`/people/${user.username}`);
    };

    const handleMessageClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isMessaging || !client || !currentUser?.username) {
            if (!client) toast.error(t('chat.error.clientNotReady', 'Chat client is not ready.'));
            if (!currentUser?.username) toast.error(t('chat.error.currentUserNotReady', 'Current user not identified.'));
            return;
        }

        setIsMessaging(true);
        try {
            console.log(`Initiating chat between ${currentUser.username} and ${user.username}`);
            // Create a direct messaging channel. If it exists, it will be returned.
            const channel = client.channel('messaging', {
                members: [currentUser.username, user.username],
            });

            // Watch the channel. This creates it if it doesn't exist,
            // adds the current user as a watcher, marks messages as read,
            // and sets this channel as the active channel in the context.
            await channel.watch();

            console.log(`Channel watched/created: ${channel.cid}`);
            // Navigate to the main chat page. The Chat component will automatically
            // render the active channel set by watch().
            navigate('/chat', { state: { channelId: channel.id } });

        } catch (err) {
            console.error("Error initiating chat:", err);
            const message = err instanceof Error ? err.message : t('chat.error.initiateFailed', 'Failed to initiate chat.');
            toast.error(message);
        } finally {
            setIsMessaging(false);
        }
    };

    return (
        // Link to the profile page using username
        <Link to={`/people/${user.username}`} style={{ textDecoration: 'none', display: 'flex', width: '100%' }}>
            <Card sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}> {/* Ensure card takes full height */}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}> {/* Ensure content grows */}
                    {/* Top section with Avatar and Name */}
                    <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                        <Avatar 
                            src={user.profilePicture || undefined} 
                            alt={user.displayName} 
                            sx={{ width: 72, height: 72 }} // Larger avatar as requested
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <AccessibleTypography fontWeight="bold" variant="h6" component="div">
                                {user.displayName}
                            </AccessibleTypography>
                            {/* Program of Study and Age */}
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                {user.tags?.find(tag => tag.type === 'programOfStudy') && (
                                    <Typography variant="body2" color="text.secondary">
                                        {user.tags.find(tag => tag.type === 'programOfStudy')?.value}
                                    </Typography>
                                )}
                                {user.age && (
                                    <Typography variant="body2" color="text.secondary">
                                        {t('people.yearsOld', { age: user.age })} {/* i18n */}
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    </Stack>

                    {/* Bio Section */}
                    {user.bio && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}> {/* Allow bio to grow */}
                            {user.bio}
                        </Typography>
                    )}

                    {/* Tags Section */}
                    {prioritizedTags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {prioritizedTags.map((tag, index) => (
                                <Chip
                                    key={`${tag.type}-${tag.value}-${index}`}
                                    label={tag.value}
                                    size="small"
                                />
                            ))}
                        </Box>
                    )}

                    {/* Action Buttons Row */}
                    <Stack
                        direction="row"
                        spacing={1} // Reduced spacing
                        justifyContent="flex-end"
                        sx={{ mt: 'auto' }} 
                    >
                        <Button
                            variant="text"
                            size="small"
                            onClick={handleConnectClick} // Use specific handler
                            disabled={isConnecting} // Disable when sending request
                            startIcon={<UserPlus size={16} weight="regular" />}
                            sx={{ flexShrink: 0 }} // Prevent shrinking
                        >
                            {isConnecting ? t('common.sending', 'Sending...') : t('people.connectButton')} {/* Show loading text */}
                        </Button>
                        <Button
                            variant="text"
                            size="small"
                            onClick={handleMessageClick}
                            disabled={isMessaging || !client || !currentUser?.username} // Disable if messaging, client not ready, or no current user
                            startIcon={isMessaging ? <CircularProgress size={16} color="inherit" /> : <ChatText size={16} weight="regular" />}
                            sx={{ flexShrink: 0 }}
                        >
                            {isMessaging ? t('common.loading', 'Loading...') : t('people.messageButton')}
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleViewProfileClick} // Use specific handler
                            startIcon={<User size={16} weight="regular" />}
                            sx={{ flexShrink: 0 }}
                        >
                            {t('people.viewProfileButton')}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Link>
    );
};


const PeoplePage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme(); // Get theme

  // Redux state selectors
  const currentPageUsers = useAppSelector(selectPaginatedUsers);
  const status = useAppSelector(selectPaginatedUsersStatus);
  const error = useAppSelector(selectPaginatedUsersError);
  const currentPage = useAppSelector(selectUsersCurrentPage);
  const totalPages = useAppSelector(selectUsersTotalPages);

  // --- Local State ---
  // Tag Filtering State
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>('neurodivergence'); // Default to neurodivergence
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [debouncedTagSearchQuery, setDebouncedTagSearchQuery] = useState<string>('');
  const [fetchedTags, setFetchedTags] = useState<Tag[]>([]);
  const [tagFetchStatus, setTagFetchStatus] = useState<TagFetchStatus>('idle');
  const [selectedFilterTags, setSelectedFilterTags] = useState<Tag[]>([]); // Tags chosen for filtering
  // User List State
  const [allUsers, setAllUsers] = useState<ListedUser[]>([]);
  const isNewSearch = useRef(false);
  const isLoadingMore = useRef(false);
  // Tag Scroll State
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  // Ref to track initial mount for useEffect
  const isInitialMount = useRef(true);
  // Scroll position state for fade effects
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true); // Default to true until we check
  // --- End Local State ---

  // Define filter options for Autocomplete (no adding new tags)
  const filter = createFilterOptions<Tag>();

  // Debounced function for tag search
  const debouncedSetTagQuery = useMemo(
    () => debounce((query: string) => {
      setDebouncedTagSearchQuery(query);
    }, 300),
    []
  );

  // Function to fetch tags for the selected category
  const handleFetchCategoryTags = useCallback(async (categoryType: string, query: string) => {
    if (!categoryType) {
      setFetchedTags([]); // Clear tags if no category selected
      setTagFetchStatus('idle');
      return;
    }
    setTagFetchStatus('loading');
    try {
      const fetchParams: FetchUserTagsParams = { type: categoryType, limit: 50 }; // Use aliased type
      if (query) {
        fetchParams.value = query;
      }
      const tags = await fetchUserTags(apiClient, fetchParams);
      setFetchedTags(tags);
      setTagFetchStatus('loaded');
    } catch (fetchError) {
      const errorMessage = (fetchError instanceof Error) ? fetchError.message : String(fetchError);
      const categoryLabel = t(tagCategories.find(c => c.type === categoryType)?.label || categoryType);
      const specificErrorMsg = t('people.error.loadingTagsSpecific', { category: categoryLabel }); // Add i18n key
      console.error(`Error fetching tags for ${categoryType}:`, errorMessage);
      setTagFetchStatus('error');
      toast.error(`${specificErrorMsg}: ${errorMessage || t('people.error.loadingTagsGeneric')}`); // Add i18n key
    }
  }, [t]);

  // Fetch tags when category or debounced search query changes
  useEffect(() => {
    handleFetchCategoryTags(selectedTagCategory, debouncedTagSearchQuery);
  }, [selectedTagCategory, debouncedTagSearchQuery, handleFetchCategoryTags]);

  // Update allUsers when new page data arrives
  useEffect(() => {
    if (status === 'succeeded') {
      if (isNewSearch.current || currentPage === 1) {
        setAllUsers(currentPageUsers);
        isNewSearch.current = false;
      } else {
        setAllUsers(prev => {
          const existingIds = new Set(prev.map(user => user.id));
          const newUsers = currentPageUsers.filter(user => !existingIds.has(user.id));
          return [...prev, ...newUsers];
        });
      }
      isLoadingMore.current = false;
    } else if (status === 'failed') {
        isLoadingMore.current = false; // Ensure loading flag is reset on error
    }
  }, [currentPageUsers, status, currentPage]);

  // Ref for the infinite scroll observer
  const observer = useRef<IntersectionObserver | null>(null);

  // Function to trigger fetching users (used for initial load, search, and infinite scroll)
  const triggerUserFetch = useCallback((page: number, isNew: boolean = false) => {
      // Extract tag types and values from the selectedFilterTags state *inside* the function
      const tagTypes = selectedFilterTags.map(tag => tag.type);
      const tagValues = selectedFilterTags.map(tag => tag.value);

      if (isNew) {
          isNewSearch.current = true;
          dispatch(clearPaginatedUsers()); // Clear previous results
          // Store filters in Redux state using the correct structure
          dispatch(setUsersFilters({
              tagTypes: tagTypes.length > 0 ? tagTypes : undefined,
              tagValues: tagValues.length > 0 ? tagValues : undefined
          }));
      } else {
          isLoadingMore.current = true;
      }
      console.log(`Fetching users - Page: ${page}, Types: ${tagTypes.join(',')}, Values: ${tagValues.join(',')}`);
      dispatch(fetchPaginatedUsers({
          apiClient,
          page: page,
          tagTypes: tagTypes.length > 0 ? tagTypes : undefined,
          tagValues: tagValues.length > 0 ? tagValues : undefined
      }));
  }, [dispatch, selectedFilterTags]); // Depends on selectedFilterTags


  // Last user element ref callback for infinite scroll
  const lastUserElementRef = useCallback((node: HTMLElement | null) => {
    if (status === 'loading' || isLoadingMore.current) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        console.log('Infinite scroll triggered');
        triggerUserFetch(currentPage + 1); // Fetch next page
      }
    }, { threshold: 0.5 });

    if (node) observer.current.observe(node);
  }, [currentPage, totalPages, status, triggerUserFetch]); // Include triggerUserFetch

  // Initial data fetch (only if idle)
  useEffect(() => {
    // Only fetch initially if status is idle and we haven't fetched before
    if (status === 'idle' && allUsers.length === 0) {
      console.log('Initial fetch triggered');
      triggerUserFetch(1, true); // Fetch page 1, mark as new
    }
  }, [dispatch, status, triggerUserFetch, allUsers.length]); // Add allUsers.length dependency

  // Clear state on unmount
  useEffect(() => {
    return () => {
      dispatch(clearPaginatedUsers());
      setAllUsers([]);
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [dispatch]);

  // --- Event Handlers ---
  // Removed unused handleNameSearchChange

  const handleTagCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedTagCategory(event.target.value);
    setTagSearchQuery(''); // Clear search when category changes
    setDebouncedTagSearchQuery('');
    setFetchedTags([]); // Clear displayed tags immediately
    // Fetching will be triggered by the useEffect watching selectedTagCategory
  };

  const handleTagInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setTagSearchQuery(newInputValue);
    // Don't debounce if clearing the input
    if (newInputValue === '') {
        setDebouncedTagSearchQuery('');
    } else if (event?.type === 'change') {
        debouncedSetTagQuery(newInputValue);
    }
  };

  // New function to handle adding searched tag
  const handleTagInputSubmit = (event: React.KeyboardEvent) => {
    // Only proceed if category is selected and there's a search query
    if (event.key === 'Enter' && selectedTagCategory && tagSearchQuery.trim()) {
      // Check if tag already exists in fetched tags
      const existingTag = fetchedTags.find(tag => 
        tag.value.toLowerCase() === tagSearchQuery.trim().toLowerCase());
      
      if (existingTag) {
        // Add existing tag if found
        handleFilterTagClick(existingTag);
      } else {
        // Create a new tag with the current category and search query
        const newTag: Tag = {
          type: selectedTagCategory,
          value: tagSearchQuery.trim()
        };
        // Add the new tag to selected filters
        handleFilterTagClick(newTag);
      }
      
      // Clear the search input
      setTagSearchQuery('');
      setDebouncedTagSearchQuery('');
    }
  };

  // Handle selecting a tag from the horizontal display
  const handleFilterTagClick = (tag: Tag) => {
    setSelectedFilterTags(prev => {
      const isSelected = prev.some(t => t.type === tag.type && t.value === tag.value);
      let newTags;
      if (isSelected) {
        newTags = prev.filter(t => !(t.type === tag.type && t.value === tag.value));
      } else {
        newTags = [...prev, tag];
      }
      // Don't trigger fetch here, let useEffect handle it
      return newTags;
    });
  };

  // Handle removing a selected filter tag (from the chip group below)
  const handleRemoveFilterTag = (tagToRemove: Tag) => {
    setSelectedFilterTags(prev => {
        const newTags = prev.filter(t => !(t.type === tagToRemove.type && t.value === tagToRemove.value));
       // Don't trigger fetch here, let useEffect handle it
       return newTags;
    });
  };

  // Removed unused handleSearchSubmit function

  // Handle scrolling the tags display
  const handleTagScroll = (direction: 'left' | 'right') => {
    if (tagsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tagsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  // --- End Event Handlers ---

  // Effect to trigger fetch when selectedFilterTags change
  useEffect(() => {
    // Skip the initial mount fetch if filters are empty initially
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Optionally, you might still want to fetch if initial filters exist,
      // but typically filters start empty.
      if (selectedFilterTags.length === 0) {
          return;
      }
    }
    // Trigger fetch whenever selectedFilterTags changes after initial mount
    console.log('Filter tags changed, triggering fetch:', selectedFilterTags);
    triggerUserFetch(1, true);
  }, [selectedFilterTags, triggerUserFetch]); // Dependency array

  // Effect to update fade states based on scroll position
  useEffect(() => {
    const updateFadeEffects = () => {
      if (tagsContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tagsContainerRef.current;
        
        // Show left fade only if scrolled away from left edge
        setShowLeftFade(scrollLeft > 5); // Small threshold for better UX
        
        // Show right fade only if there's more content to the right
        setShowRightFade(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5); // Small threshold for better UX
      }
    };

    // Set initial fade states
    updateFadeEffects();

    // Add scroll event listener
    const scrollContainer = tagsContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateFadeEffects);
    }

    // Cleanup
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', updateFadeEffects);
      }
    };
  }, [fetchedTags]); // Re-run when tags change

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* <Box sx={{ mb: 3 }}>
        <Breadcrumb customItems={breadcrumbItems} />
      </Box> */}

      <AccessibleTypography variant="h4" component="h1" gutterBottom>
        {t('people.header', 'Find People')}
      </AccessibleTypography>

      {/* --- Filter Section (No Paper Background) --- */}
      <Box sx={{ mb: 4 }}> {/* Add margin below the entire filter section */}
        {/* Combined Input Row */}
        <CombinedInputContainer sx={{ mb: 2 }}> {/* Add margin below the input */}
          <Select
            variant="standard" // Use standard variant for seamless look
            disableUnderline // Hide default underline
            value={selectedTagCategory}
            onChange={handleTagCategoryChange}
            displayEmpty
            // size="small" // Size is handled by container padding/font size
            sx={{
                minWidth: 150, // Adjust width as needed
                mr: 1, // Margin between select and divider
                fontWeight: 500,
                fontSize: '0.9rem',
                 // Match Onboarding style for select dropdown appearance
                '& .MuiSelect-select': {
                    paddingRight: '24px !important',
                    paddingLeft: '0px',
                    paddingTop: '12px', // Adjust padding for vertical centering
                    paddingBottom: '12px',
                },
            }}
            renderValue={(selected) => {
                if (!selected) {
                  return <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>{t('people.selectCategoryPlaceholder', 'Select Category...')}</Typography>;
                }
                // Apply truncation styles to the Typography displaying the selected value
                return (
                  <Typography sx={{
                     fontSize: '0.95rem',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     // Ensure it doesn't push other elements (might need adjustment based on layout)
                     maxWidth: 'calc(100% - 8px)' // Prevent overflow slightly
                  }}>
                    {t(tagCategories.find(c => c.type === selected)?.label || selected)}
                  </Typography>
                );
            }}
             MenuProps={{ // Match Onboarding style for menu paper
                PaperProps: {
                  sx: {
                    borderRadius: theme.shape.borderRadius * 1.5,
                    mt: 0.5,
                    backgroundColor: `${theme.palette.background.paper}E6`, // 0.9 transparency
                    backdropFilter: 'blur(8px)',
                  },
                },
             }}
          >
            <MenuItem value="" disabled>
              <Typography color="text.secondary">{t('people.selectCategoryPlaceholder', 'Select Category...')}</Typography>
            </MenuItem>
            {tagCategories.map((category) => (
              <MenuItem key={category.type} value={category.type}>
                {t(category.label)}
              </MenuItem>
            ))}
          </Select>

           {/* Vertical Divider */}
           <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, height: '30px', alignSelf: 'center' }} />

          <Autocomplete<Tag, false, true, false> // Multiple=false, DisableClearable=true, FreeSolo=false
            // value={null} // Controlled outside by fetchedTags display
            onChange={(_, newValue) => {
              // When a suggestion is selected from the dropdown
              if (newValue) {
                handleFilterTagClick(newValue);
                // Clear the autocomplete input after selection
                setTagSearchQuery('');
                setDebouncedTagSearchQuery('');
              }
            }}
            inputValue={tagSearchQuery}
            onInputChange={handleTagInputChange}
            fullWidth // Allow Autocomplete to fill remaining space
            options={Array.isArray(fetchedTags) ? fetchedTags.filter(ft => !selectedFilterTags.some(st => st.type === ft.type && st.value === ft.value)) : []} // Ensure fetchedTags is array before filtering
            loading={tagFetchStatus === 'loading'}
            getOptionLabel={(option) => option.value}
            isOptionEqualToValue={(option, value) => option.value === value.value && option.type === value.type}
            filterOptions={filter} // Use standard filtering
            noOptionsText={tagFetchStatus === 'loading' ? t('common.loading', 'Loading...') : t('people.noTagsFound', 'No tags found')}
            disabled={!selectedTagCategory}
            // sx={{ flexGrow: 1 }} // Let the container manage width
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard" // Use standard variant for seamless look
                // size="small" // Size handled by container/input props
                placeholder={selectedTagCategory ? t('people.searchTagPlaceholder', 'Search tags...') : t('people.selectCategoryFirst', 'Select category first')}
                InputProps={{
                  ...params.InputProps,
                  disableUnderline: true, // Hide underline
                  startAdornment: (
                    <>
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <MagnifyingGlass size={20} color={theme.palette.action.active} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {tagFetchStatus === 'loading' ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }}/> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                onKeyDown={handleTagInputSubmit}
                 sx={{ // Match Onboarding style for input field
                    '& .MuiInputBase-root': {
                      paddingTop: '0px', // Reduce padding to make shorter
                      paddingBottom: '0px',
                    },
                     '& .MuiInputBase-input': {
                       padding: theme.spacing(1, 1, 1, 0), // Reduced padding
                       fontSize: '0.95rem',
                       height: '1.2em', // Make input area shorter
                     },
                 }}
              />
            )}
            // Don't render selected tags here, they are shown below
            renderTags={() => null}
            ListboxProps={{
              style: {
                backgroundColor: `${theme.palette.background.paper}E6`, // 0.9 transparency
                backdropFilter: 'blur(8px)',
                borderRadius: theme.shape.borderRadius * 2,
              }
            }}
          />
        </CombinedInputContainer>
         {/* Removed FilterRow wrapper */}

        {/* Display Fetched Tags (Scrollable) - Now directly under CombinedInputContainer */}
        {selectedTagCategory && (
          <TagsDisplayContainer sx={{ mt: 1 }}>
            {/* Left Scroll Arrow */}
            <ScrollArrowButton
               onClick={() => handleTagScroll('left')}
               size="small"
               sx={{ left: 0 }}
               aria-label={t('common.scrollLeft', 'Scroll left')}
            >
               <CaretLeft size={20} />
            </ScrollArrowButton>

            {/* Fade overlays - only shown conditionally */}
            {showLeftFade && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${theme.spacing(5)}`,
                  width: theme.spacing(4), // Smaller width
                  zIndex: 1,
                  pointerEvents: 'none',
                  background: `linear-gradient(to right, ${theme.palette.background.paper} 20%, transparent 100%)`,
                }}
              />
            )}
            {showRightFade && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: `${theme.spacing(5)}`,
                  width: theme.spacing(4), // Smaller width
                  zIndex: 1,
                  pointerEvents: 'none',
                  background: `linear-gradient(to left, ${theme.palette.background.paper} 20%, transparent 100%)`,
                }}
              />
            )}

            {/* --- SKELETON LOADING STATE --- */}
            {tagFetchStatus === 'loading' && (
              <TagsScrollArea ref={tagsContainerRef}> 
                {[...Array(15)].map((_, index) => ( // Render 7 skeletons
                  <Skeleton 
                    key={index} 
                    variant="rounded" 
                    width={80} // Approximate chip width
                    height={24} // Approximate small chip height
                    sx={{ borderRadius: '16px' }} // Match chip border radius if needed
                  />
                ))}
              </TagsScrollArea>
            )}
            {/* --- END SKELETON LOADING STATE --- */} 

            {/* --- LOADED STATE --- */}
            {tagFetchStatus === 'loaded' && fetchedTags.length > 0 && (
              <TagsScrollArea ref={tagsContainerRef}>
                 {fetchedTags.map((tag) => {
                    const isSelected = selectedFilterTags.some(t => t.type === tag.type && t.value === tag.value);
                    return (
                        <Chip
                            key={`fetched-${tag.type}-${tag.value}`}
                            label={tag.value}
                            clickable
                            onClick={() => handleFilterTagClick(tag)}
                            color={isSelected ? "primary" : "default"}
                            size="small" 
                         />
                    );
                })}
              </TagsScrollArea>
            )}
            {/* --- END LOADED STATE --- */}

            {/* Right Scroll Arrow */}
            <ScrollArrowButton
               onClick={() => handleTagScroll('right')}
               size="small"
               sx={{ right: 0 }}
               aria-label={t('common.scrollRight', 'Scroll right')}
            >
               <CaretRight size={20} />
            </ScrollArrowButton>
          </TagsDisplayContainer>
        )}
        {tagFetchStatus === 'error' && (
            <Alert severity="warning" sx={{ width: '100%' }}>{t('people.error.loadingTagsGeneric')}</Alert> // Removed size="small"
        )}

        {/* Row 4: Display Selected Filter Tags */}
        {selectedFilterTags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center', color: 'text.secondary' }}>{t('people.activeFilters', 'Filters:')}</Typography>
                {selectedFilterTags.map((tag) => (
                    <Chip
                        key={`filter-${tag.type}-${tag.value}`}
                        label={`${tag.value} (${t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)})`}
                        onDelete={() => handleRemoveFilterTag(tag)}
                        size="small"
                        color="primary"
                    />
                ))}
            </Box>
        )}
      </Box>
      {/* --- End Filter Section --- */}


      {/* Initial Loading */}
      {status === 'loading' && allUsers.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {status === 'failed' && !isLoadingMore.current && ( // Don't show main error if just load more failed
        <Alert severity="error" sx={{ mb: 2 }}>{error || t('people.errorLoading', 'Failed to load people.')}</Alert>
      )}

      {/* Users List - Always render if we have users */}
      {allUsers.length > 0 ? (
        <Grid container spacing={3}>
          {allUsers.map((user, index) => {
            // Attach observer to an earlier element to trigger loading sooner
            const attachObserver =
              allUsers.length >= 6 // Only attach if we have a decent number of users
                ? index === allUsers.length - 6 // Attach to the 6th to last item
                : index === 0 && allUsers.length > 0; // Or first item if fewer than 6

            return (
              <Grid
                item
                xs={12} sm={6} md={6} lg={6} // Keep 2 columns on larger screens
                key={user.id}
                sx={{ display: 'flex' }}
                ref={attachObserver ? lastUserElementRef : undefined}
              >
                <UserCard user={user} />
              </Grid>
            );
          })}
        </Grid>
      ) : status === 'succeeded' && (
        // No Results Message
        <Box sx={{
          textAlign: 'center',
          p: 5,
          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24',
          borderRadius: '16px',
          border: 'none',
          boxShadow: 'none'
        }}>
          <AccessibleTypography color="text.secondary">
            {t('people.noResults', 'No people found matching your criteria.')}
          </AccessibleTypography>
        </Box>
      )}

      {/* Loading More Indicator - show at bottom when loading more data */}
      {status === 'loading' && allUsers.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, mt: 2 }}>
          <CircularProgress size={30} />
        </Box>
      )}

      {/* End of Results Indicator - show when all pages are loaded */}
      {status === 'succeeded' && currentPage === totalPages && allUsers.length > 0 && (
        <Box sx={{ textAlign: 'center', p: 3, mt: 2 }}>
          <Typography color="text.secondary">
            {t('people.endOfResults', "You've reached the end of the results")}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default PeoplePage;
