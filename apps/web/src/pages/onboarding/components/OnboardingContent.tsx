import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Added
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Added
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info'; // Added
import InterestsIcon from '@mui/icons-material/Interests'; // Added
import SearchIcon from '@mui/icons-material/Search'; // Added for search input
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  // FormControl, // Removed unused import
  Grid,
  IconButton,
  InputAdornment, // Added for search icon
  MenuItem, // Added for category select
  Paper,
  Select, // Added for category select
  SelectChangeEvent, // Added for category select
  Step,
  StepConnector, // Added
  stepConnectorClasses, // Added
  StepIconProps, // Added
  StepLabel,
  Stepper,
  styled,
  TextField,
  Typography,
  useTheme, // Added
} from '@mui/material';
import { selectIdToken } from '@neurolink/shared/src/features/tokens/tokensSlice';
import { Tag, UserPreferences, UserProfileInput } from '@neurolink/shared/src/features/user/types';
// Import FetchTagsParams from the correct path
import { createUser, fetchTags, FetchTagsParams } from '@neurolink/shared/src/features/user/userAPI';
import { setOnboardingStatus } from '@neurolink/shared/src/features/user/userSlice';
import { jwtDecode } from 'jwt-decode';
import { debounce } from 'lodash'; // Added for debouncing search
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../app/api/apiClient';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import { useAppDispatch, useAppSelector } from '../../../app/store/initStore';

// --- Styled Components ---
const ContentContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  zIndex: 1,
  overflow: 'auto',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.up('md')]: {
    paddingTop: theme.spacing(4),
  }
}));

// --- Enhanced Styled Components ---
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light'
    ? 'rgba(255, 255, 255)' // Slightly less transparent
    : 'rgba(40, 40, 40)', // Slightly less transparent dark
  borderRadius: theme.shape.borderRadius * 3, // Softer corners
  boxShadow: `0 8px 32px 0 ${theme.palette.mode === 'light' ? 'rgba(100, 100, 100, 0.2)' : 'rgba(0, 0, 0, 0.37)'}`, // Adjusted shadow
  padding: theme.spacing(5), // More padding
  position: 'relative',
  overflow: 'visible',
  width: '100%',
  maxWidth: 650, // Made card smaller
  margin: `${theme.spacing(4)} auto`
}));

// --- New Styled Component for Search Bar ---
const StyledSearchContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1), // Adjust padding
  borderRadius: theme.shape.borderRadius * 5, // Make it very round
  boxShadow: theme.shadows[2], // Add elevation
  backgroundColor: theme.palette.background.paper, // Use paper background
  marginBottom: theme.spacing(3),
  gap: theme.spacing(1), // Add gap between select and textfield
}));
// --- End New Styled Component ---

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2, // Consistent rounding
    backgroundColor: theme.palette.background.default, // Use theme background
    '& fieldset': { // Target the fieldset directly
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.light, // Lighter hover
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px', // Keep border width consistent
    },
  },
  marginBottom: theme.spacing(3) // Increased margin
}));

const AvatarPlaceholder = styled(Box)(({ theme }) => ({
  width: 110, // Larger avatar
  height: 110,
  borderRadius: '50%',
  backgroundColor: theme.palette.action.hover, // Softer background
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(4), // Increased margin
  position: 'relative',
  border: `2px solid ${theme.palette.divider}` // Add subtle border
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5, // Consistent rounding
  fontSize: '0.9rem',
  height: 38, // Slightly taller
  padding: theme.spacing(0.5, 1.75), // Adjust padding
  borderWidth: '1px',
  '&.MuiChip-outlined': {
    borderColor: theme.palette.primary.light, // Use primary light for outline
    color: theme.palette.text.secondary,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.main,
    }
  },
  '&.MuiChip-filled': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark, // Darken on hover
    }
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2, // Consistent rounding
  padding: theme.spacing(1.5, 4), // More padding
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  minWidth: 130 // Slightly wider
}));

// Custom Stepper Connector
const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

// Custom Step Icon
const QontoStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
  ({ theme, ownerState }) => ({
    color: theme.palette.divider,
    display: 'flex',
    height: 22,
    alignItems: 'center',
    ...(ownerState.active && {
      color: theme.palette.primary.main,
    }),
    '& .QontoStepIcon-completedIcon': {
      color: theme.palette.primary.main,
      zIndex: 1,
      fontSize: 24, // Larger icon
    },
    '& .QontoStepIcon-circle': {
      width: 12, // Larger circle
      height: 12,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
    },
  }),
);

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  // Map step index (1-based) to icons
  const icons: { [index: string]: React.ReactElement } = {
    1: <AccountCircleIcon />,
    2: <InfoIcon />,
    3: <InterestsIcon />,
    4: <CheckCircleIcon />,
  };

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <CheckCircleIcon className="QontoStepIcon-completedIcon" />
      ) : (
        // Render specific icon based on the step number (props.icon is 1-based index)
        icons[String(props.icon)] || <div className="QontoStepIcon-circle" />
      )}
    </QontoStepIconRoot>
  );
}
// --- End Enhanced Styled Components ---

// Define tag categories
const tagCategories = [
  { type: 'programOfStudy', label: 'onboarding.programOfStudy' },
  { type: 'yearLevel', label: 'onboarding.yearLevel' },
  { type: 'neurodivergence', label: 'onboarding.neurodivergenceStatus' },
  { type: 'interest', label: 'onboarding.interests' },
  { type: 'skill', label: 'onboarding.skills' },
  { type: 'language', label: 'onboarding.languages' },
  { type: 'course', label: 'onboarding.courses' },
];

// Define steps for the Stepper (using updated keys)
const steps = [
  'onboarding.stepBasicInfo',
  'onboarding.stepAboutYou',
  'onboarding.stepTagsInterests',
  'onboarding.stepReview',
];

// Initial form values
const initialFormValues = {
  displayName: '',
  profilePicture: '',
  age: '',
  bio: '',
  selectedTags: [] as Tag[],
  preferences: {
    visibility: 'public',
    accessibility: {
      colorScheme: 'system',
      highContrastMode: false,
    },
    communication: ['email'],
  } as UserPreferences
};

// Define Decoded ID Token type
interface DecodedIdToken {
  email: string;
  sub: string;
}

// Type for tag fetching status per category
type TagFetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

const OnboardingContent: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme(); // Get theme
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const idToken = useAppSelector(selectIdToken);
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Tag Search State ---
  const [allTags, setAllTags] = useState<Record<string, Tag[]>>({}); // Store all fetched tags per category
  const [tagFetchStatus, setTagFetchStatus] = useState<Record<string, TagFetchStatus>>(
    () => Object.fromEntries(tagCategories.map(cat => [cat.type, 'idle']))
  );
  const [tagFetchError, setTagFetchError] = useState<Record<string, string | null>>(
    () => Object.fromEntries(tagCategories.map(cat => [cat.type, null]))
  );
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>(tagCategories[0]?.type || '');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [debouncedTagSearchQuery, setDebouncedTagSearchQuery] = useState<string>(''); // State for debounced query
  // --- End Tag Search State ---

  // Debounced function to update the search query state used for fetching
  const debouncedSetQuery = useMemo(
    () => debounce((query: string) => {
      setDebouncedTagSearchQuery(query);
    }, 300), // 300ms debounce delay
    []
  );

  // Function to fetch tags for a specific category and query
  const handleFetchCategoryTags = useCallback(async (categoryType: string, query: string) => {
    // Don't fetch if category is missing
    if (!categoryType) {
      return;
    }
    // Reset status for the specific category if query changes, force loading state
    setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loading' }));
    setTagFetchError(prev => ({ ...prev, [categoryType]: null }));

    try {
      const fetchParams: FetchTagsParams = { type: categoryType, limit: 20 };
      if (query) {
        fetchParams.q = query; // Add query param if it exists
      }
      const fetchedTags = await fetchTags(apiClient, fetchParams);
      setAllTags(prev => ({ ...prev, [categoryType]: fetchedTags })); // Store fetched tags under the category
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loaded' }));
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      const categoryLabel = t(tagCategories.find(c => c.type === categoryType)?.label || categoryType);
      const specificErrorMsg = t('onboarding.error.loadingTagsSpecific', { category: categoryLabel });
      console.error(`Error fetching tags for ${categoryType}:`, errorMessage);
      setTagFetchError(prev => ({ ...prev, [categoryType]: errorMessage || t('onboarding.error.loadingTagsGeneric') }));
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'error' }));
      toast.error(`${specificErrorMsg}: ${errorMessage}`);
    }
  }, [t]); // Removed tagFetchStatus dependency as we handle loading state directly

  // Fetch tags when the selected category or debounced search query changes
  useEffect(() => {
    handleFetchCategoryTags(selectedTagCategory, debouncedTagSearchQuery);
  }, [selectedTagCategory, debouncedTagSearchQuery, handleFetchCategoryTags]);

  // Handle form input changes (for non-tag fields)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { // Updated type
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle tag category selection change
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedTagCategory(event.target.value);
    setTagSearchQuery(''); // Clear search query when category changes
  };

  // Handle tag search input change - update local state immediately, debounce the fetch trigger
  const handleTagSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setTagSearchQuery(newQuery); // Update immediate input value
    debouncedSetQuery(newQuery); // Trigger debounced fetch query update
  };

  // Handle tag selection/deselection
  const handleTagToggle = (tag: Tag) => {
    setFormValues(prev => {
      // Revert to type/value check for existence
      const tagExists = prev.selectedTags.some(t => t.type === tag.type && t.value === tag.value);
      const updatedTags = tagExists
        // Revert filter logic to use type/value
        ? prev.selectedTags.filter(t => !(t.type === tag.type && t.value === tag.value))
        : [...prev.selectedTags, tag];
      return { ...prev, selectedTags: updatedTags };
    });
  };

  // Check if a tag is selected
  const isTagSelected = (tag: Tag) => {
    // Revert to type/value check
    return formValues.selectedTags.some(t => t.type === tag.type && t.value === tag.value);
  };

  // Remove unused filteredTags variable as filtering is now done via API query
  // const filteredTags = useMemo(() => { ... });

  // Validate step before proceeding
  const validateStep = () => {
    if (activeStep === 0 && !formValues.displayName) {
      const errorMsg = t('onboarding.error.requiredDisplayName');
      setFormError(errorMsg);
      toast.warn(errorMsg);
      return false;
    }
    // Add other step validations if needed
    setFormError(null);
    return true;
  };

  // Handle next button click
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prevStep => prevStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Handle back button click
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    if (!idToken) {
      setSubmitError(t('onboarding.error.noIdToken'));
      toast.error(t('onboarding.error.noIdToken'));
      setIsSubmitting(false);
      return;
    }
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = jwtDecode<DecodedIdToken>(idToken);
    } catch (err) {
      const errorMsg = t('onboarding.error.invalidToken');
      console.error("Error decoding token:", err);
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }
    if (!decodedToken.email) {
      const errorMsg = t('onboarding.error.noEmail');
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }
    const profileData: UserProfileInput = {
      email: decodedToken.email,
      displayName: formValues.displayName,
      profilePicture: formValues.profilePicture || undefined,
      age: formValues.age ? parseInt(formValues.age, 10) : undefined,
      bio: formValues.bio || undefined,
      tags: formValues.selectedTags,
      preferences: formValues.preferences
    };
    try {
      const createdUser = await createUser(apiClient, profileData);
      console.log('User created successfully:', createdUser);
      toast.success(t('onboarding.success.profileCreated'));
      dispatch(setOnboardingStatus(true));
      navigate('/profile'); // Navigate to profile page on success
    } catch (err) {
      const errorMsg = t('onboarding.error.submitFailed');
      const detailedError = (err instanceof Error) ? err.message : String(err);
      setSubmitError(detailedError || errorMsg);
      toast.error(`${errorMsg}: ${detailedError}`);
    } finally {
      setIsSubmitting(false); // Ensure this runs even on error
    }
  };

  // Handle close/cancel
  const handleCancel = useCallback(() => {
    navigate('/');
    toast.info(t('onboarding.cancelled'));
  }, [navigate, t]);

  // --- Render Functions for Steps ---
  const renderBasicInfoForm = () => (
    <Box sx={{ mt: 4 }}>
      <AvatarPlaceholder>
        {formValues.profilePicture ? (
          <Avatar src={formValues.profilePicture} alt={formValues.displayName || 'User'} sx={{ width: '100%', height: '100%' }} />
        ) : (
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'transparent', color: 'text.secondary' }}>
            {/* Use an icon or initials as fallback */}
            <AccountCircleIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          </Avatar>
        )}
      </AvatarPlaceholder>
      <Grid container spacing={3}> {/* Increased spacing */}
        <Grid item xs={12}>
          {/* Removed htmlFor from AccessibleTypography */}
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>{t('onboarding.displayName')}*</AccessibleTypography>
          <StyledTextField required fullWidth id="displayName" name="displayName" value={formValues.displayName} onChange={handleInputChange} error={!!formError && !formValues.displayName} helperText={t('onboarding.displayNameHelp')} aria-describedby="displayName-helper-text" />
        </Grid>
        <Grid item xs={12}>
          {/* Removed htmlFor from AccessibleTypography */}
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>{t('onboarding.profilePictureUrl')}</AccessibleTypography>
          <StyledTextField fullWidth id="profilePicture" name="profilePicture" value={formValues.profilePicture} onChange={handleInputChange} helperText={t('onboarding.profilePictureHelp')} aria-describedby="profilePicture-helper-text" />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAboutYouForm = () => (
    <Box sx={{ mt: 5 }}> {/* Increased top margin */}
      <Grid container spacing={3}> {/* Increased spacing */}
        <Grid item xs={12} sm={6}>
           {/* Removed htmlFor from AccessibleTypography */}
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>{t('onboarding.age')}</AccessibleTypography>
          <StyledTextField fullWidth id="age" name="age" label={t('onboarding.ageOptional')} type="number" value={formValues.age} onChange={handleInputChange} InputProps={{ inputProps: { min: 0, max: 120 } }} />
        </Grid>
        <Grid item xs={12}>
           {/* Removed htmlFor from AccessibleTypography */}
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>{t('onboarding.bio')}</AccessibleTypography>
          <StyledTextField fullWidth id="bio" name="bio" label={t('onboarding.bioOptional')} multiline rows={4} value={formValues.bio} onChange={handleInputChange} helperText={t('onboarding.bioHelp')} inputProps={{ maxLength: 500 }} aria-describedby="bio-helper-text" />
          <AccessibleTypography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }} aria-live="polite">
            {t('onboarding.charCount', { count: formValues.bio?.length || 0, max: 500 })}
          </AccessibleTypography>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTagsForm = () => (
    <Box sx={{ mt: 5 }}>
      <AccessibleTypography variant="h5" component="h2" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
        {t('onboarding.selectTagsHelp')}
      </AccessibleTypography>
      <AccessibleTypography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('onboarding.selectCategoryAndSearch')} {/* Add this translation key */}
      </AccessibleTypography>

      {/* Combined Search Bar */}
      <StyledSearchContainer elevation={2}>
        <Select
          variant="standard" // Use standard variant for less visual clutter inside Paper
          disableUnderline // Remove underline
          value={selectedTagCategory}
          onChange={handleCategoryChange}
          sx={{
            minWidth: 150, // Adjust width as needed
            fontWeight: 500,
            fontSize: '0.9rem',
            pl: 1, // Padding left
            '& .MuiSelect-select': {
              paddingRight: '24px !important', // Ensure space for icon
            },
          }}
          MenuProps={{ // Style dropdown menu
            PaperProps: {
              sx: {
                borderRadius: theme.shape.borderRadius * 1.5,
                mt: 0.5,
              },
            },
          }}
        >
          {tagCategories.map((category) => (
            <MenuItem key={category.type} value={category.type}>
              {t(category.label)}
            </MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          variant="standard" // Use standard variant
          placeholder={t('common.searchTagsPlaceholder')}
          value={tagSearchQuery}
          onChange={handleTagSearchChange}
          InputProps={{
            disableUnderline: true, // Remove underline
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 1 }}>
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          aria-label={t('common.searchTagsPlaceholder')}
          sx={{
            '& .MuiInputBase-input': { // Style input text
              padding: theme.spacing(1, 1, 1, 0),
              fontSize: '0.95rem',
            },
          }}
        />
      </StyledSearchContainer>

      {/* Tag Display Area - Keep existing style */}
      <Box sx={{ minHeight: 150, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2, bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800] }}>
        {tagFetchStatus[selectedTagCategory] === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={30} />
          </Box>
        )}
        {tagFetchStatus[selectedTagCategory] === 'error' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Alert severity="error" sx={{ width: '100%', borderRadius: theme.shape.borderRadius }}>
              {tagFetchError[selectedTagCategory] || t('onboarding.error.loadingTagsGeneric')}
            </Alert>
          </Box>
        )}
        {tagFetchStatus[selectedTagCategory] === 'loaded' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {/* Use allTags[selectedTagCategory] directly, as filtering is now done via API query */}
            {(allTags[selectedTagCategory] || []).length > 0 ? (
              (allTags[selectedTagCategory] || []).map((tag) => (
                <StyledChip
                  key={`${tag.type}-${tag.value}`}
                  label={tag.value}
                  onClick={() => handleTagToggle(tag)}
                  color="primary"
                  variant={isTagSelected(tag) ? "filled" : "outlined"}
                  clickable
                />
              ))
            ) : (
              <AccessibleTypography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', width: '100%', textAlign: 'center', py: 3 }}>
                {tagSearchQuery ? t('onboarding.noTagsMatch') : t('onboarding.noTagsAvailable')} {/* Add onboarding.noTagsMatch */}
              </AccessibleTypography>
            )}
          </Box>
        )}
         {/* Handle idle state specifically when a category IS selected but no query yet */}
         {tagFetchStatus[selectedTagCategory] === 'idle' && selectedTagCategory && (
           <AccessibleTypography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', width: '100%', textAlign: 'center', py: 3 }}>
                {t('onboarding.startTypingToSearch')} {/* Add this translation key */}
              </AccessibleTypography>
        )}
        {/* Handle idle state when NO category is selected */}
        {tagFetchStatus[selectedTagCategory] === 'idle' && !selectedTagCategory && (
           <AccessibleTypography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', width: '100%', textAlign: 'center', py: 3 }}>
                {t('onboarding.selectCategoryPrompt')}
              </AccessibleTypography>
        )}
      </Box>

       {/* Display Selected Tags - Keep existing style */}
       {formValues.selectedTags.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <AccessibleTypography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
            {t('onboarding.selectedTags')}
          </AccessibleTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius }}>
            {formValues.selectedTags.map((tag) => (
              <StyledChip
                key={`selected-${tag.type}-${tag.value}`}
                label={tag.value}
                title={t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)} // Restore title prop
                onDelete={() => handleTagToggle(tag)} // Restore onDelete prop
                color="secondary"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

   const renderReviewForm = () => (
    <Box sx={{ mt: 5 }}> {/* Increased top margin */}
      <AccessibleTypography variant="h5" component="h2" gutterBottom sx={{ mb: 4, fontWeight: 500 }}>{t('onboarding.reviewInfo')}</AccessibleTypography>

      {/* Basic Info Section */}
      <Box sx={{ mb: 4, p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2 }}>
        <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t('onboarding.basicInfo')}</AccessibleTypography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}><Typography fontWeight="medium">{t('onboarding.displayName')}:</Typography></Grid>
          <Grid item xs={12} sm={8}><Typography>{formValues.displayName}</Typography></Grid>
          {formValues.age && (<>
            <Grid item xs={12} sm={4}><Typography fontWeight="medium">{t('onboarding.age')}:</Typography></Grid>
            <Grid item xs={12} sm={8}><Typography>{formValues.age}</Typography></Grid>
          </>)}
          {formValues.profilePicture && (<>
            <Grid item xs={12} sm={4}><Typography fontWeight="medium">{t('onboarding.profilePictureUrl')}:</Typography></Grid>
            <Grid item xs={12} sm={8}><Typography sx={{ wordBreak: 'break-all' }}>{formValues.profilePicture}</Typography></Grid>
          </>)}
        </Grid>
      </Box>

      {/* Bio Section */}
      {formValues.bio && (
        <Box sx={{ mb: 4, p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2 }}>
          <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t('onboarding.bio')}</AccessibleTypography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{formValues.bio}</Typography> {/* Preserve line breaks */}
        </Box>
      )}

      {/* Tags Section */}
      {formValues.selectedTags.length > 0 && (
        <Box sx={{ mb: 4, p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2 }}>
          <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t('onboarding.tags')}</AccessibleTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {formValues.selectedTags.map((tag, idx) => (
              <StyledChip
                key={`review-${tag.type}-${tag.value}-${idx}`}
                label={tag.value}
                title={t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)} // Show category on hover
                color="secondary" // Match selected color in tag form
                variant="filled" // Keep filled for review
                size="medium" // Use medium size for review
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Submission Error */}
      {submitError && (<Alert severity="error" sx={{ mt: 3, borderRadius: theme.shape.borderRadius }}>{submitError}</Alert>)}
    </Box>
  );

  // Render step content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderBasicInfoForm();
      case 1: return renderAboutYouForm();
      case 2: return renderTagsForm();
      case 3: return renderReviewForm();
      default: return null;
    }
  };

  return (
    <ContentContainer>
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        <StyledPaper elevation={3}>
          <IconButton onClick={handleCancel} sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }} aria-label={t('common.close')}>
            <CloseIcon />
          </IconButton>

          {/* Use Custom Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel connector={<QontoConnector />} sx={{ mb: 5 }}>
             {/* Removed unused index */}
            {steps.map((labelKey) => (
              <Step key={labelKey}>
                {/* Pass the custom icon component */}
                <StepLabel StepIconComponent={QontoStepIcon}>{t(labelKey)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Title */}
          <AccessibleTypography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
            {t(steps[activeStep])}
          </AccessibleTypography>
          {/* Removed Divider */}

          {/* Form Validation Error */}
          {formError && !isSubmitting && (<Alert severity="warning" sx={{ mb: 3, borderRadius: theme.shape.borderRadius }}>{formError}</Alert>)}

          {/* Render Active Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
            <ActionButton
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || isSubmitting}
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' }
              }}
            >
              {t('common.back')} {/* Assuming common.back exists */}
            </ActionButton>
            <ActionButton
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              disableElevation
            >
              {isSubmitting ? (<CircularProgress size={24} color="inherit" />) : (activeStep === steps.length - 1 ? t('onboarding.saveProfile') : t('common.next'))} {/* Assuming common.next exists */}
            </ActionButton>
          </Box>
        </StyledPaper>
      </Container>
    </ContentContainer>
  );
};

export default OnboardingContent;
