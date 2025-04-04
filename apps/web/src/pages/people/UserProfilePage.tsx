import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Removed RouterLink
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Stack,
  Typography, // Using standard Typography for headers, AccessibleTypography for content
  Paper,
  // Removed Grid
  useTheme,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import apiClient from '../../app/api/apiClient'; // Keep apiClient for the function call
import { User, Tag, fetchUserByUsername } from '@neurolink/shared'; // Import fetchUserByUsername
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import Breadcrumb from '../../app/components/Breadcrumb';
import { toast } from 'react-toastify';

// Define Tag Categories mapping (similar to PeoplePage/Onboarding)
// This helps translate the tag type into a readable header
const tagCategoryLabels: { [key: string]: string } = {
  programOfStudy: 'onboarding.programOfStudy',
  yearLevel: 'onboarding.yearLevel',
  neurodivergence: 'onboarding.neurodivergenceStatus',
  interest: 'onboarding.interests',
  skill: 'onboarding.skills',
  language: 'onboarding.languages',
  course: 'onboarding.courses',
  // Add any other potential tag types here
};

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>(); // Changed userId to username
  const { t } = useTranslation();
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) { // Check for username
        setError(t('userProfile.error.missingUsername', 'Username is missing.')); // Updated error message key
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Use the shared function to fetch the user
        const fetchedUser = await fetchUserByUsername(apiClient, username); 
        setUser(fetchedUser);
      } catch (err) {
        console.error('Failed to fetch user profile by username:', err);
        // Error message handling remains the same, as fetchUserByUsername throws errors
        const errorMessage = err instanceof Error ? err.message : t('userProfile.error.genericLoad', 'Failed to load user profile.');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, t]); // Depend on username

  // Group tags by type
  const groupedTags = user?.tags?.reduce((acc, tag) => {
    const type = tag.type || 'other'; // Group tags without a type under 'other'
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(tag);
    return acc;
  }, {} as { [key: string]: Tag[] });

  // Breadcrumb items - update dynamically when user data loads
  const breadcrumbItems = user
    ? [
        { label: t('nav.home'), path: '/' },
        { label: t('nav.people'), path: '/people' },
        { label: user.displayName, path: `/people/${username}` } // Use username in breadcrumb path
      ]
    : [
        { label: t('nav.home'), path: '/' },
        { label: t('nav.people'), path: '/people' }
      ];

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
         <Box sx={{ mb: 3 }}>
           <Breadcrumb customItems={breadcrumbItems} />
         </Box>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
         <Box sx={{ mb: 3 }}>
           <Breadcrumb customItems={breadcrumbItems} />
         </Box>
        <Alert severity="warning">{t('userProfile.error.notFound', 'User not found.')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumb customItems={breadcrumbItems} />
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24',
          boxShadow: theme.palette.mode === 'light' 
            ? '0 4px 12px rgba(0,0,0,0.05)'
            : '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        {/* Profile Header with gradient background */}
        <Box 
          sx={{ 
            p: 4,
            background: theme.palette.mode === 'light' 
              ? 'linear-gradient(to right, #F0F4F9, #E5ECF6)' 
              : 'linear-gradient(to right, #1e1e24, #25252d)',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            sx={{ width: '100%' }}
          >
            <Avatar
              src={user.profilePicture || undefined}
              alt={user.displayName}
              sx={{ 
                width: 120, 
                height: 120,
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: `0 4px 10px ${alpha(theme.palette.common.black, 0.1)}`
              }}
            />
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-start' },
              mt: { xs: 2, sm: 0 }
            }}>
              <AccessibleTypography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}
              >
                {user.displayName}
              </AccessibleTypography>
              
              {user.age && (
                <AccessibleTypography 
                  variant="subtitle1" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 1
                  }}
                >
                  {t('people.yearsOld', { age: user.age })}
                </AccessibleTypography>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Content Section */}
        <Box sx={{ p: 4 }}>
          {/* Bio Section */}
          {user.bio && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                component="h2"
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 2
                }}
              >
                {t('userProfile.aboutHeader', 'About')}
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <AccessibleTypography 
                  paragraph 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    color: theme.palette.text.secondary,
                    mb: 0
                  }}
                >
                  {user.bio}
                </AccessibleTypography>
              </Paper>
            </Box>
          )}

          {/* Tags Section - Grouped */}
          {groupedTags && Object.keys(groupedTags).length > 0 && (
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom 
                component="h2"
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 3
                }}
              >
                {t('userProfile.tagsHeader', 'Details & Interests')}
              </Typography>
              
              <Stack spacing={3}>
                {Object.entries(groupedTags).map(([type, tags]) => (
                  <Box key={type}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600, 
                        textTransform: 'capitalize',
                        color: theme.palette.text.primary,
                        mb: 1.5
                      }}
                    >
                      {t(tagCategoryLabels[type] || type, type.replace(/([A-Z])/g, ' $1'))}
                    </Typography>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      useFlexGap 
                      flexWrap="wrap"
                      sx={{ ml: -0.5 }}
                    >
                      {tags.map((tag, index) => (
                        <Chip
                          key={`${tag.type}-${tag.value}-${index}`}
                          label={tag.value}
                          size="small"
                          sx={{
                            m: 0.5,
                            backgroundColor: theme.palette.mode === 'light' ? '#E5ECF6' : '#2D2D36',
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'light' 
                                ? alpha('#E5ECF6', 0.8)
                                : alpha('#2D2D36', 0.8)
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default UserProfilePage;
