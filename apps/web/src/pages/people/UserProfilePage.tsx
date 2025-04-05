import React, { useEffect, useState } from 'react';
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
// Revert to standard shared import, remove unused PaginatedPostsResponse
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
  const [posts, setPosts] = useState<Post[]>([]); // State for posts
  const [postsLoading, setPostsLoading] = useState(false); // State for posts loading
  const [postsError, setPostsError] = useState<string | null>(null); // State for posts error
  const [totalPosts, setTotalPosts] = useState<number>(0); // State for total post count
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
  useEffect(() => {
    const loadPosts = async () => {
      if (!username) return; // Don't fetch if username is missing

      setPostsLoading(true);
      setPostsError(null);
      try {
        // Use shared API function - Define type for response locally if needed
        const response = await fetchUserPosts(apiClient, username); // fetchUserPosts is now imported correctly
        setPosts(response.posts);
        setTotalPosts(response.totalPosts);
      } catch (err) {
        console.error(`Failed to fetch posts for ${username}:`, err);
        const message = err instanceof Error ? err.message : t('userProfile.error.postsLoad', 'Failed to load posts.');
        setPostsError(message);
        // toast.error(message); // Optional: Show toast for post loading errors
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, [username, t]); // Re-fetch if username changes

  // Group Tags
  const groupedTags = user?.tags?.reduce((acc, tag) => {
    const type = tag.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(tag);
    return acc;
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
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{totalPosts}</Typography> {/* Use state variable */}
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
          {/* Posts Grid */}
          {postsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          )}
          {postsError && !postsLoading && (
            <Alert severity="error" sx={{ mt: 2 }}>{postsError}</Alert>
          )}
        {!postsLoading && !postsError && (
          <Stack spacing={2}> {/* Use Stack for vertical list */}
            {posts.map((post) => (
              // Pass author info from the user state
              <PostCard 
                key={post.id} 
                post={post} 
                authorDisplayName={user.displayName} 
                authorProfilePicture={user.profilePicture} 
              /> 
            ))}
            {posts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5 }}> {/* Center the no posts message */}
                <AccessibleTypography color="text.secondary">{t('userProfile.noPosts', 'No posts yet.')}</AccessibleTypography>
              </Box>
            )}
          </Stack>
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
