import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Stack,
  Typography,
  useTheme,
  alpha,
  Button,
  // Grid, // Removed unused import
  Tabs,
  Tab,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import apiClient from '../../app/api/apiClient';
// Remove unused PaginatedPostsResponse import
import { User, Tag, fetchUserByUsername, Post, fetchUserPosts } from '@neurolink/shared';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { toast } from 'react-toastify';
import PostCard from '../../features/posts/components/PostCard'; // Import the new PostCard component
import { ChatText, UserPlus } from '@phosphor-icons/react'; // Added ChatText and UserPlus icons

// Define Tag Categories mapping
const tagCategoryLabels: { [key: string]: string } = {
  programOfStudy: 'onboarding.programOfStudy',
  yearLevel: 'onboarding.yearLevel',
  neurodivergence: 'onboarding.neurodivergenceStatus',
  interest: 'onboarding.interests',
  skill: 'onboarding.skills',
  language: 'onboarding.languages',
  course: 'onboarding.courses',
};

// TabPanel component helper
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // For user profile loading
  const [error, setError] = useState<string | null>(null); // For user profile error
  
  // --- Posts State --- 
  const [posts, setPosts] = useState<Post[]>([]); 
  const [postsLoading, setPostsLoading] = useState(false); 
  const [postsError, setPostsError] = useState<string | null>(null); 
  const [totalPosts, setTotalPosts] = useState<number>(0); // Reinstate totalPosts
  const [currentPostsPage, setCurrentPostsPage] = useState(0); 
  const [totalPostsPages, setTotalPostsPages] = useState(0);
  const isLoadingMorePosts = useRef(false);
  const postsObserver = useRef<IntersectionObserver | null>(null);
  const isNewPostFetch = useRef(true);
  // --- End Posts State ---

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fetch User Profile
  useEffect(() => {
    const fetchUser = async () => {
      if (!username) {
        setError(t('userProfile.error.missingUsername', 'Username is missing.'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedUser = await fetchUserByUsername(apiClient, username);
        setUser(fetchedUser);
      } catch (err) {
        console.error('Failed to fetch user profile by username:', err);
        const errorMessage = err instanceof Error ? err.message : t('userProfile.error.genericLoad', 'Failed to load user profile.');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false); // Only stop main loading after user fetch attempt
      }
    };
    fetchUser();
  }, [username, t]);

  // Fetch User Posts
  const POSTS_PER_PAGE = 5; // Set posts per page to 5

  const triggerPostFetch = useCallback(async (page: number, isNew: boolean = false) => {
    if (!username || isLoadingMorePosts.current) return;

    if (isNew) {
        isNewPostFetch.current = true;
        setPostsLoading(true);
        setPosts([]); 
        setCurrentPostsPage(0); 
        setTotalPostsPages(0);
        setTotalPosts(0); // Reset total posts on new fetch
    } else {
        isLoadingMorePosts.current = true;
        setPostsLoading(false); 
    }
    setPostsError(null);

    try {
      const response = await fetchUserPosts(apiClient, username, page, POSTS_PER_PAGE);
      
      // --- Updated setPosts logic ---
      setPosts(prev => {
        if (isNewPostFetch.current) {
           // If it's a new fetch, completely replace the posts
           return response.posts;
        } else {
           // If loading more, filter out duplicates before appending
           const existingIds = new Set(prev.map(p => p.id));
           const newUniquePosts = response.posts.filter(p => !existingIds.has(p.id));
           return [...prev, ...newUniquePosts];
        }
      });
      // --- End Updated setPosts logic ---

      setCurrentPostsPage(response.page);
      setTotalPosts(response.totalPosts); // Update total posts count
      setTotalPostsPages(Math.ceil(response.totalPosts / (response.limit || POSTS_PER_PAGE))); 
      isNewPostFetch.current = false; // Reset flag after state update is queued
    } catch (err) {
      console.error(`Failed to fetch posts page ${page} for ${username}:`, err);
      const message = err instanceof Error ? err.message : t('userProfile.error.postsLoad', 'Failed to load posts.');
      setPostsError(message);
    } finally {
      setPostsLoading(false); 
      isLoadingMorePosts.current = false;
    }
  }, [username, t]);

  // Initial posts fetch and refetch on username change
  useEffect(() => {
    if (username) {
      triggerPostFetch(1, true); // Fetch page 1 as a new fetch
    }
    // Cleanup function to clear posts if username changes? Optional.
    return () => {
        setPosts([]);
        setCurrentPostsPage(0);
        setTotalPostsPages(0);
    }
  }, [username, triggerPostFetch]);

  // Intersection Observer for Posts
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (postsLoading || isLoadingMorePosts.current) return;
    if (postsObserver.current) postsObserver.current.disconnect();

    postsObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPostsPage < totalPostsPages) {
        console.log('Post Infinite scroll triggered');
        triggerPostFetch(currentPostsPage + 1); // Fetch next page
      }
    }, { threshold: 0.8 }); // Trigger when 80% visible

    if (node) postsObserver.current.observe(node);
  }, [postsLoading, isLoadingMorePosts, currentPostsPage, totalPostsPages, triggerPostFetch]);

  // Group Tags - Fix reduce and types
  const groupedTags = user?.tags?.reduce((acc: { [key: string]: Tag[] }, tag: Tag) => {
    const type = tag.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(tag);
    return acc; // Return accumulator
  }, {} as { [key: string]: Tag[] });

  // --- Render Logic ---

  if (loading) { // Show main loader only while fetching user profile
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) { // Show error if user profile fetch failed
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!user) { // Show not found if user profile fetch succeeded but returned no user
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">{t('userProfile.error.notFound', 'User not found.')}</Alert>
      </Container>
    );
  }

  // Render profile page once user data is available
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        {/* Profile Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4, md: 6 }} sx={{ mb: 4, alignItems: 'center' }}>
          <Avatar src={user.profilePicture || undefined} alt={user.displayName} sx={{ width: { xs: 100, sm: 130, md: 150 }, height: { xs: 100, sm: 130, md: 150 }, border: `4px solid ${theme.palette.background.paper}`, boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}` }} />
          <Stack spacing={2} sx={{ flexGrow: 1, width: '100%' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="h5" sx={{ fontWeight: 400 }}>{user.displayName}</Typography>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ borderRadius: '8px' }}
                  startIcon={<UserPlus size={16} weight="regular" />}
                >
                  {t('userProfile.addFriend', 'Add Friend')}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<ChatText size={16} weight="regular" />}
                >
                  {t('people.messageButton', 'Message')}
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{totalPosts}</Typography>
                <Typography variant="body2" color="text.secondary">{t('userProfile.posts', 'posts')}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>88 {/* Hardcoded */}</Typography>
                <Typography variant="body2" color="text.secondary">{t('userProfile.friends', 'friends')}</Typography>
              </Box>
            </Stack>
            <Stack spacing={0.5}>
              {user.bio && <AccessibleTypography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{user.bio}</AccessibleTypography>}
              {user.age && <AccessibleTypography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>{t('people.yearsOld', { age: user.age })}</AccessibleTypography>}
            </Stack>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label={t('userProfile.tabsLabel', 'Profile content tabs')} centered textColor="primary" indicatorColor="primary">
            <Tab label={t('userProfile.tabPosts', 'POSTS')} {...a11yProps(0)} sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }} />
            <Tab label={t('userProfile.tabTags', 'TAGS')} {...a11yProps(1)} sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {/* Posts Loading (Initial) */}
          {postsLoading && posts.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          )}
          {/* Posts Error (Initial/Major) */}
          {postsError && posts.length === 0 && !postsLoading && (
            <Alert severity="error" sx={{ mt: 2 }}>{postsError}</Alert>
          )}
          {/* Posts List */}
          {!postsLoading && posts.length > 0 && (
            <Stack spacing={2}> 
              {posts.map((post, index) => {
                // Attach observer N elements from the end
                const attachObserver = posts.length >= 3 
                  ? index === posts.length - 3 
                  : index === 0;
                return (
                  <Box key={post.id} ref={attachObserver ? lastPostElementRef : undefined}>
                     <PostCard post={post} /> 
                  </Box>
                )
              })}
            </Stack>
          )}
          {/* No Posts Message */}
          {!postsLoading && !postsError && posts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <AccessibleTypography color="text.secondary">{t('userProfile.noPosts', 'No posts yet.')}</AccessibleTypography>
              </Box>
          )}
          {/* Loading More Indicator */}
          {isLoadingMorePosts.current && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, mt: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}
           {/* End of Results Indicator */}
          {!isLoadingMorePosts.current && currentPostsPage === totalPostsPages && posts.length > 0 && (
            <Box sx={{ textAlign: 'center', p: 3, mt: 1 }}>
              <Typography color="text.secondary">
                {t('people.endOfResults', "You've reached the end of the results")} 
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Tags Section */}
          {groupedTags && Object.keys(groupedTags).length > 0 ? (
            <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
              {Object.entries(groupedTags).map(([type, tags]) => (
                // Wrap each category in a Box with padding and border
                <Box key={type} sx={{ 
                  p: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius * 1.5, // Slightly more rounded
                  // backgroundColor: alpha(theme.palette.background.default, 0.5) // Optional: subtle background
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize', color: theme.palette.text.primary, mb: 1.5 }}>
                    {t(tagCategoryLabels[type] || type, type.replace(/([A-Z])/g, ' $1'))}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {tags.map((tag, index) => (
                      <Chip 
                        key={`${tag.type}-${tag.value}-${index}`} 
                        label={tag.value} 
                        size="small" 
                        variant="outlined" // Revert back to outlined variant
                        sx={{ 
                          cursor: 'default', // Ensure default cursor
                          // Remove hover effect by keeping styles the same or using default
                          '&:hover': { 
                            // For outlined variant, the default hover is often just a slight border change
                            // We can explicitly set background to transparent if needed
                            backgroundColor: 'transparent' 
                          }
                        }}
                      /> 
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 5 }}><AccessibleTypography color="text.secondary">{t('userProfile.noTags', 'No tags added yet.')}</AccessibleTypography></Box>
          )}
        </TabPanel>
      </Box>
    </Container>
  );
};

export default UserProfilePage;
