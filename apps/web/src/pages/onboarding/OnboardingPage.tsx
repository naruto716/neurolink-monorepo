import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { jwtDecode } from 'jwt-decode'; // Added jwt-decode
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  styled
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchTags, createUser } from '@neurolink/shared/src/features/user/userAPI'; // Added createUser
import { Tag, UserPreferences } from '@neurolink/shared/src/features/user/types'; // Added UserPreferences
import { selectIdToken } from '@neurolink/shared/src/features/tokens/tokensSlice'; // Added token selector
import { useAppSelector, useAppDispatch } from '../../app/store/initStore'; // Added Redux hooks
import apiClient from '../../app/api/apiClient'; // Corrected: Import the instance directly
import { setOnboardingStatus } from '@neurolink/shared/src/features/user/userSlice'; // Corrected: Import setOnboardingStatus
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import Breadcrumb from '../../app/components/Breadcrumb'; // Added Breadcrumb
import { toast } from 'react-toastify'; // Added toast for notifications

// Custom styled components for modern UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: 16,
  boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.05)',
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'visible',
  width: '100%',
  maxWidth: 750,
  margin: '0 auto'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : '#2D3748',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
  },
  marginBottom: theme.spacing(2)
}));

const AvatarPlaceholder = styled(Box)(({ theme }) => ({
  width: 84,
  height: 84,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'light' ? '#F1F5F9' : '#2D3748',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(3),
  position: 'relative'
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: 8,
  fontSize: '0.85rem',
  height: 36,
  '&.MuiChip-outlined': {
    borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
  },
  '&.MuiChip-filled': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }
}));

const ActionButton = styled(Button)({
  borderRadius: 12,
  padding: '10px 24px',
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: 'none',
  minWidth: 100
});

// Define tag categories
const tagCategories = [
  { type: 'programOfStudy', label: 'onboarding.programOfStudy' },
  { type: 'yearLevel', label: 'onboarding.yearLevel' },
  { type: 'neurodivergence', label: 'onboarding.neurodivergenceStatus' },
  { type: 'interest', label: 'onboarding.interests' },
  { type: 'skill', label: 'onboarding.skills' },
  { type: 'language', label: 'onboarding.languages' },
  { type: 'course', label: 'onboarding.courses' }
];

// Initial form values
const initialFormValues = {
  displayName: '',
  profilePicture: '',
  age: '',
  bio: '',
  selectedTags: [] as Tag[],
  // Add a default preferences structure based on UserPreferences
  preferences: {
    visibility: 'private', // Default visibility
    accessibility: {
      colorScheme: 'system', // Default color scheme
      highContrastMode: false, // Default contrast mode
    },
    communication: ['email'], // Default communication method
  } as UserPreferences
};

// Define Decoded ID Token type
interface DecodedIdToken {
  email: string;
  // Add other relevant fields if needed, e.g., sub for user ID
  sub: string; 
}

const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const idToken = useAppSelector(selectIdToken);
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null); // Added for submission errors
  const [isSubmitting, setIsSubmitting] = useState(false); // Added for loading state
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);

  // Fetch tags from API using apiClient
  useEffect(() => {
    const getTags = async () => {
      setTagsLoading(true);
      setTagsError(null);
      try {
        // Pass the apiClient instance to fetchTags
        const fetchedTags = await fetchTags(apiClient); 
        setTags(fetchedTags);
      } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        setTagsError(errorMessage || t('onboarding.error.loadingTags'));
        toast.error(t('onboarding.error.loadingTags') + `: ${errorMessage}`);
      } finally {
        setTagsLoading(false);
      }
    };
    
    getTags();
  }, [t]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Search across all tag values
    const results = tags.filter(tag => 
      tag.value.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Add a tag from search results
  const handleAddTagFromSearch = (tag: Tag) => {
    handleTagToggle(tag);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle tag selection
  const handleTagToggle = (tag: Tag) => {
    setFormValues(prev => {
      const tagExists = prev.selectedTags.some(t => 
        t.type === tag.type && t.value === tag.value
      );
      
      const updatedTags = tagExists
        ? prev.selectedTags.filter(t => !(t.type === tag.type && t.value === tag.value))
        : [...prev.selectedTags, tag];
      
      return { ...prev, selectedTags: updatedTags };
    });
  };

  // Check if a tag is selected
  const isTagSelected = (tag: Tag) => {
    return formValues.selectedTags.some(t => 
      t.type === tag.type && t.value === tag.value
    );
  };

  // Get tags by category
  const getTagsByType = (tagType: string) => {
    return tags.filter(tag => tag.type === tagType);
  };

  // Validate step before proceeding
  const validateStep = () => {
    if (activeStep === 0) {
      // Basic information validation
      if (!formValues.displayName) {
        setFormError(t('onboarding.error.required'));
        return false;
      }
    }
    
    // No validation for other steps yet
    setFormError(null);
    return true;
  };

  // Handle next button click
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  // Handle form submission (Marked as async)
  const handleSubmit = async () => { 
    setIsSubmitting(true); // Set submitting state
    setSubmitError(null); // Clear previous errors

    if (!idToken) {
      setSubmitError(t('onboarding.error.noIdToken'));
      toast.error(t('onboarding.error.noIdToken'));
      setIsSubmitting(false);
      return;
    }

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = jwtDecode<DecodedIdToken>(idToken);
    } catch (err) { // Use the error variable or rename if unused
      console.error("Error decoding token:", err); // Log the error
      setSubmitError(t('onboarding.error.invalidToken'));
      toast.error(t('onboarding.error.invalidToken'));
      setIsSubmitting(false);
      return;
    }

    if (!decodedToken.email) {
      setSubmitError(t('onboarding.error.noEmail'));
      toast.error(t('onboarding.error.noEmail'));
      setIsSubmitting(false); // Added missing setIsSubmitting
      return; // Added missing return
    } // Added missing closing brace

    // Prepare the data for API, including email and preferences
    const profileData = { // Renamed variable to avoid conflict
      email: decodedToken.email, // Add email from decoded token
      displayName: formValues.displayName,
      profilePicture: formValues.profilePicture || undefined,
      age: formValues.age ? parseInt(formValues.age, 10) : undefined,
      bio: formValues.bio || undefined,
      tags: formValues.selectedTags,
      preferences: formValues.preferences // Add preferences
    };

    try {
      // Pass the renamed profileData
      const createdUser = await createUser(apiClient, profileData); 
      console.log('User created successfully:', createdUser);
      toast.success(t('onboarding.success.profileCreated'));
      
      // Update Redux state to indicate onboarding is complete
      dispatch(setOnboardingStatus(true));
      
      // Navigate to the user's profile page or dashboard
      navigate('/profile'); // Or '/dashboard' or wherever appropriate

    } catch (err) { // Use the error variable
      const errorMessage = (err instanceof Error) ? err.message : String(err);
      setSubmitError(errorMessage || t('onboarding.error.submitFailed'));
      toast.error(t('onboarding.error.submitFailed') + `: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close/cancel - navigate back or to home
  const handleCancel = useCallback(() => {
    // Navigate to home or previous page
    navigate('/'); 
    toast.info(t('onboarding.cancelled'));
  }, [navigate, t]);

  // Step 1: Basic information form
  const renderBasicInfoForm = () => (
    <Box sx={{ mt: 4 }}>
      <AvatarPlaceholder>
        {formValues.profilePicture ? (
          <Avatar
            src={formValues.profilePicture}
            alt={formValues.displayName || 'User'}
            sx={{ width: 84, height: 84 }}
          />
        ) : (
          <Avatar
            sx={{
              width: 84,
              height: 84,
              bgcolor: 'transparent',
              color: 'text.secondary'
            }}
          >
            <Typography variant="h5" component="span" color="text.secondary">
              👤
            </Typography>
          </Avatar>
        )}
      </AvatarPlaceholder>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <StyledTextField
            required
            fullWidth
            name="displayName"
            label={t('onboarding.displayName')}
            value={formValues.displayName}
            onChange={handleInputChange}
            error={!!formError && !formValues.displayName}
            helperText={t('onboarding.displayNameHelp')}
          />
        </Grid>
        <Grid item xs={12}>
          <StyledTextField
            fullWidth
            name="profilePicture"
            label={t('onboarding.profilePictureUrl')}
            value={formValues.profilePicture}
            onChange={handleInputChange}
            helperText={t('onboarding.profilePictureHelp')}
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Step 2: About you form
  const renderAboutYouForm = () => (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <StyledTextField
            fullWidth
            name="age"
            label={t('onboarding.age')}
            type="number"
            value={formValues.age}
            onChange={handleInputChange}
            InputProps={{ inputProps: { min: 0, max: 120 } }}
          />
        </Grid>
        <Grid item xs={12}>
          <StyledTextField
            fullWidth
            name="bio"
            label={t('onboarding.bio')}
            multiline
            rows={4}
            value={formValues.bio}
            onChange={handleInputChange}
            helperText={t('onboarding.bioHelp')}
            inputProps={{ maxLength: 500 }}
          />
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 1, display: 'block', textAlign: 'right' }}
          >
            {formValues.bio?.length || 0}/500 {/* Handle potential undefined bio */}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  // Step 3: Tags form
  const renderTagsForm = () => (
    <Box sx={{ mt: 4 }}>
      <AccessibleTypography variant="subtitle1" gutterBottom>
        {t('onboarding.selectTags')}
      </AccessibleTypography>
      
      {/* Search bar for tags */}
      <Box sx={{ mb: 3 }}>
        <StyledTextField
          fullWidth
          name="tagSearch"
          label={t('onboarding.searchTags')}
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={t('onboarding.searchTagsPlaceholder')}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                🔍
              </Box>
            ),
          }}
        />
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <Paper 
            elevation={3} 
            sx={{ 
              mt: 1, 
              p: 1, 
              maxHeight: 200, 
              overflowY: 'auto',
              borderRadius: 2
            }}
          >
            <Typography variant="caption" sx={{ pl: 1, color: 'text.secondary' }}>
              {t('onboarding.searchResults')} ({searchResults.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
              {searchResults.map((tag, idx) => (
                <StyledChip
                  key={`search-${tag.type}-${tag.value}-${idx}`}
                  label={`${tag.value} (${t(`onboarding.${tag.type}Short`)})`}
                  onClick={() => handleAddTagFromSearch(tag)}
                  color="primary"
                  variant={isTagSelected(tag) ? "filled" : "outlined"}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Paper>
        )}
      </Box>
      
      {tagsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} />
        </Box>
      ) : tagsError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {tagsError}
        </Alert>
      ) : (
        <>
          {tagCategories.map(category => (
            <Box key={category.type} sx={{ mb: 4 }}>
              <AccessibleTypography 
                variant="subtitle2" 
                fontWeight="medium" 
                sx={{ mb: 1.5 }}
              >
                {t(category.label)}:
              </AccessibleTypography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {getTagsByType(category.type).map((tag, idx) => (
                  <StyledChip
                    key={`${tag.type}-${tag.value}-${idx}`}
                    label={tag.value}
                    onClick={() => handleTagToggle(tag)}
                    color="primary"
                    variant={isTagSelected(tag) ? "filled" : "outlined"}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </>
      )}
    </Box>
  );

  // Step 4: Review form
  const renderReviewForm = () => (
    <Box sx={{ mt: 4 }}>
      <AccessibleTypography variant="h6" gutterBottom>
        {t('onboarding.reviewInfo')}
      </AccessibleTypography>
      
      <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'left', mb: 4 }}>
        <AccessibleTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
          {t('onboarding.basicInfo')}:
        </AccessibleTypography>
        <Box sx={{ mb: 3, pl: 2 }}>
          <Typography>{t('onboarding.displayName')}: {formValues.displayName}</Typography>
          {formValues.age && <Typography>{t('onboarding.age')}: {formValues.age}</Typography>}
        </Box>
        
        {formValues.bio && (
          <>
            <AccessibleTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
              {t('onboarding.bio')}:
            </AccessibleTypography>
            <Box sx={{ mb: 3, pl: 2 }}>
              <Typography>{formValues.bio}</Typography>
            </Box>
          </>
        )}
        
        {formValues.selectedTags.length > 0 && (
          <>
            <AccessibleTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
              {t('onboarding.tags')}:
            </AccessibleTypography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pl: 2 }}>
              {formValues.selectedTags.map((tag, idx) => (
                <StyledChip 
                  key={idx} 
                  label={tag.value} 
                  color="primary" 
                  variant="filled"
                  size="small" 
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );

  // Render step content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicInfoForm();
      case 1:
        return renderAboutYouForm();
      case 2:
        return renderTagsForm();
      case 3:
        return renderReviewForm();
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (activeStep) {
      case 0:
        return t('onboarding.basicInfo');
      case 1: 
        return t('onboarding.aboutYou');
      case 2:
        return t('onboarding.tagsInterests');
      case 3:
        return t('onboarding.reviewInfo');
      default:
        return t('onboarding.stepDefault'); // Added default translation key
    }
  };
  
  // Define breadcrumb items
  const breadcrumbItems = [
    { label: t('nav.home'), path: '/' },
    { label: t('onboarding.title'), path: '/onboarding' }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      {/* Add Breadcrumb */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumb customItems={breadcrumbItems} />
      </Box>
      
      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <AccessibleTypography variant="h4" component="h1" sx={{ fontWeight: 600 }}> {/* Use AccessibleTypography */}
            {getStepTitle()}
          </AccessibleTypography>
          <IconButton 
            onClick={handleCancel}
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.05)', 
              '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } 
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {formError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {formError || submitError /* Show submit error as well */}
          </Alert>
        )}

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
          <ActionButton
            variant="outlined"
            onClick={handleCancel}
            sx={{ 
              color: 'text.secondary',
              borderColor: 'rgba(0,0,0,0.12)',
              '&:hover': { borderColor: 'rgba(0,0,0,0.3)', bgcolor: 'rgba(0,0,0,0.03)' }
            }}
          >
            {t('onboarding.cancel')}
          </ActionButton>
          
          <ActionButton
            variant="contained"
            onClick={activeStep === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting} // Disable button while submitting
            disableElevation
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              activeStep === 3 ? t('onboarding.save') : t('onboarding.next')
            )}
          </ActionButton>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default OnboardingPage;
