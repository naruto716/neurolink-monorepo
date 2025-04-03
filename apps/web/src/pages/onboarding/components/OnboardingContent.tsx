// Replace MUI Icons with Phosphor Icons
import {
  UserCircle,
  CheckCircle,
  X,
  Info,
  Sparkle, // Replacing InterestsIcon
  MagnifyingGlass, // Replacing SearchIcon
  Plus, // For the new Add button
} from '@phosphor-icons/react';
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
  Autocomplete, // Added for tag input
  createFilterOptions, // Added for Autocomplete
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

// --- New Styled Component for Combined Input ---
const StyledInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: theme.shape.borderRadius * 5, // Very round corners
  border: `1px solid ${theme.palette.divider}`, // Add border
  backgroundColor: theme.palette.background.paper, // Use paper background
  paddingLeft: theme.spacing(1.5), // Padding for select
  paddingRight: theme.spacing(0.5), // Padding for button
  marginBottom: theme.spacing(3),
  // Remove box shadow (elevation)
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

  // Map step index (1-based) to Phosphor icons
  const icons: { [index: string]: React.ReactElement } = {
    1: <UserCircle />,
    2: <Info />,
    3: <Sparkle />, // Use Sparkle for Interests/Skills step
    4: <CheckCircle />,
  };

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <CheckCircle weight="fill" className="QontoStepIcon-completedIcon" /> // Use Phosphor CheckCircle
      ) : (
        // Render specific icon based on the step number (props.icon is 1-based index)
        React.cloneElement(icons[String(props.icon)] || <div className="QontoStepIcon-circle" />, { size: 18 }) // Adjust size if needed
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
  // Removed unused tagFetchError state
  // const [tagFetchError, setTagFetchError] = useState<Record<string, string | null>>(...)
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>(tagCategories[0]?.type || '');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>(''); // Input value for Autocomplete
  const [debouncedTagSearchQuery, setDebouncedTagSearchQuery] = useState<string>(''); // State for debounced query
  // --- End Tag Search State ---

  // Define filter options for Autocomplete (adjust type for freeSolo)
  const filter = createFilterOptions<Tag | { inputValue: string; title: string }>();


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
    // Removed tagFetchError reset
    // setTagFetchError(prev => ({ ...prev, [categoryType]: null }));

    try {
      const fetchParams: FetchTagsParams = { type: categoryType, limit: 20 };
      if (query) {
        fetchParams.value = query; // Use value param for search
      }
      const fetchedTags = await fetchTags(apiClient, fetchParams);
      setAllTags(prev => ({ ...prev, [categoryType]: fetchedTags })); // Store fetched tags under the category
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loaded' }));
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      const categoryLabel = t(tagCategories.find(c => c.type === categoryType)?.label || categoryType);
      const specificErrorMsg = t('onboarding.error.loadingTagsSpecific', { category: categoryLabel });
      console.error(`Error fetching tags for ${categoryType}:`, errorMessage);
      // Removed setting tagFetchError state
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'error' }));
      toast.error(`${specificErrorMsg}: ${errorMessage || t('onboarding.error.loadingTagsGeneric')}`); // Show generic error if specific is missing
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
    setDebouncedTagSearchQuery(''); // Clear debounced query as well
  };

  // Handle Autocomplete input change - update local state immediately, debounce the fetch trigger
  const handleTagInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setTagSearchQuery(newInputValue); // Update immediate input value
    // Only debounce if it's user input, not selection clearing
    if (event?.type === 'change') {
       debouncedSetQuery(newInputValue); // Trigger debounced fetch query update
    }
  };


  // Handle adding/removing tags via Autocomplete
  const handleTagsChange = (event: React.SyntheticEvent, newValue: (Tag | { inputValue: string; title: string } | string)[]) => {
    // Calculate potential new total tag count considering only actual tags added/removed
    const newActualTags = newValue.filter(v => typeof v !== 'string' && !('inputValue' in v)) as Tag[];
    const otherCategoryTagsCount = formValues.selectedTags.filter(tag => tag.type !== selectedTagCategory).length;
    const potentialTotalCount = otherCategoryTagsCount + newActualTags.length;


    if (potentialTotalCount > 20) {
      toast.warn(t('onboarding.error.tagLimitReached', { max: 20 }));
       // Prevent adding more if the limit is reached or exceeded by this change
       // Allow removals by checking if the new count is less than the previous count for this category
       if (newActualTags.length > currentCategorySelectedTags.length) {
          return;
       }
    }


    setFormValues(prev => {
      // Process the new value from Autocomplete
      const currentCategoryNewTags = newValue
        .map(option => {
          // Handle direct string input (freeSolo)
          if (typeof option === 'string') {
            if (!option.trim()) return null; // Ignore empty/whitespace
            return { type: selectedTagCategory, value: option.trim() };
          }
          // Handle the "Add..." suggestion object
          if (typeof option === 'object' && option && 'inputValue' in option) {
             if (!option.inputValue.trim()) return null; // Ignore empty/whitespace
            return { type: selectedTagCategory, value: option.inputValue.trim() };
          }
          // Handle existing Tag object suggestions
          if (typeof option === 'object' && option && 'type' in option && 'value' in option) {
            return option;
          }
          return null; // Ignore invalid options
        })
        .filter(tag => tag !== null) as Tag[]; // Filter out nulls and assert type

      // Filter out duplicates within the current category's new tags based on value
      const uniqueCurrentCategoryNewTags = currentCategoryNewTags.filter((tag, index, self) =>
        index === self.findIndex((t) => (
          t.value === tag.value
        ))
      );


      // Get tags from other categories that are already selected
      const otherCategoryTags = prev.selectedTags.filter(tag => tag.type !== selectedTagCategory);

      // Combine tags from other categories with the unique new tags for the current category
      const updatedSelectedTags = [...otherCategoryTags, ...uniqueCurrentCategoryNewTags];

      // Ensure the final list doesn't exceed the limit (double-check)
      if (updatedSelectedTags.length > 20) {
         // This case might happen if duplicates existed across categories, though less likely with this structure
         // We simply slice to enforce the limit strictly.
         updatedSelectedTags.length = 20;
         // Consider if a warning is needed here too
      }


      return { ...prev, selectedTags: updatedSelectedTags };
    });
     // Clear the input field after adding a tag
     setTagSearchQuery('');
     setDebouncedTagSearchQuery('');
  };

  // Handle clicking the explicit "Add" button
  const handleAddTagClick = () => {
    const valueToAdd = tagSearchQuery.trim();
    if (!valueToAdd) return; // Don't add empty tags

    // Check total tag limit first
    if (formValues.selectedTags.length >= 20) {
      toast.warn(t('onboarding.error.tagLimitReached', { max: 20 }));
      return;
    }

    // Check if tag already exists in the current category or overall
    const alreadySelected = formValues.selectedTags.some(tag => tag.value === valueToAdd && tag.type === selectedTagCategory);
    if (alreadySelected) {
      toast.info(t('onboarding.error.tagAlreadySelected', { tag: valueToAdd })); // Add this translation key
      return;
    }

    // Add the new tag
    setFormValues(prev => {
       const newTag: Tag = { type: selectedTagCategory, value: valueToAdd };
       // Ensure final list doesn't exceed limit (should be caught above, but double-check)
       const updatedSelectedTags = [...prev.selectedTags, newTag].slice(0, 20);
       return { ...prev, selectedTags: updatedSelectedTags };
    });

    // Clear input
    setTagSearchQuery('');
    setDebouncedTagSearchQuery('');
  };


  // Removed unused handleTagToggle function

  // Check if a tag is selected (Now handled by Autocomplete's value prop)
  // const isTagSelected = (tag: Tag) => { ... };

  // Filter selected tags for the current category to pass to Autocomplete value prop
  const currentCategorySelectedTags = useMemo(() => {
    return formValues.selectedTags.filter(tag => tag.type === selectedTagCategory);
  }, [formValues.selectedTags, selectedTagCategory]);


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
            {/* Use Phosphor UserCircle */}
            <UserCircle size={60} color={theme.palette.text.secondary} />
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
        {t('onboarding.selectCategoryAndAddTags')} {/* Updated translation key */}
      </AccessibleTypography>

      {/* Combined Input Container */}
      <StyledInputContainer>
        <Select
          variant="standard" // Use standard variant inside the container
          disableUnderline // Remove underline
          value={selectedTagCategory}
          onChange={handleCategoryChange}
          sx={{
            minWidth: 150, // Adjust width as needed
            mr: 1, // Margin between select and autocomplete
            fontWeight: 500,
            fontSize: '0.9rem',
            '& .MuiSelect-select': {
              paddingRight: '24px !important', // Ensure space for icon
              paddingLeft: '0px', // Adjust padding
              paddingTop: '12px', // Align text vertically
              paddingBottom: '12px',
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

        {/* Separator */}
        <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, height: '30px', alignSelf: 'center' }} />

        {/* Autocomplete Input - Adjust generic types */}
        <Autocomplete<Tag | { inputValue: string; title: string }, true, false, true>
          multiple
          freeSolo // Allow custom input
          fullWidth
          value={currentCategorySelectedTags} // Still Tag[]
          onChange={handleTagsChange}
          inputValue={tagSearchQuery}
          onInputChange={handleTagInputChange}
          options={allTags[selectedTagCategory] || []} // Still Tag[]
          loading={tagFetchStatus[selectedTagCategory] === 'loading'}
          getOptionLabel={(option) => {
            // Handle string input from freeSolo
            if (typeof option === 'string') {
              return option;
            }
            // Handle the "Add..." suggestion object
            if (option && 'inputValue' in option) {
              return option.title;
            }
            // Handle Tag object
            return option?.value || '';
          }}
          isOptionEqualToValue={(option, val) => {
             // Need robust comparison for Tag objects
             if (typeof option === 'object' && 'value' in option && typeof val === 'object' && 'value' in val) {
               return option.value === val.value && option.type === val.type;
             }
             return false; // Don't consider strings or "Add..." objects equal to Tags
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const { inputValue } = params;
            // Suggest the creation of a new value if input is not empty and not already selected/suggested
            // Use a more explicit type guard within .some()
            const isExistingSuggestion = options.some((option) => {
              // Check if it's a Tag object before accessing 'value'
              if (typeof option === 'object' && option && 'value' in option && 'type' in option) {
                return option.value === inputValue;
              }
              return false;
            });
            const isAlreadySelected = currentCategorySelectedTags.some(tag => tag.value === inputValue);

            if (inputValue !== '' && !isExistingSuggestion && !isAlreadySelected) {
              // Push the special object type for the "Add" suggestion
              filtered.push({
                inputValue: inputValue,
                title: `Add "${inputValue}"`,
              });
            }
            return filtered;
          }}
          renderOption={(props, option) => {
            // Handle rendering the "Add..." suggestion object
            if (typeof option === 'object' && 'title' in option) {
              return <li {...props}>{option.title}</li>;
            }
            // Handle rendering Tag objects
            if (typeof option === 'object' && 'value' in option) {
               return <li {...props}>{option.value}</li>;
            }
            // Fallback for unexpected types (shouldn't happen)
            return <li {...props}></li>;
          }}
          renderTags={() => null} // Don't render chips inside the input field itself
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard" // Use standard variant inside container
              placeholder={selectedTagCategory ? t('onboarding.searchOrAddTagPlaceholder') : t('onboarding.selectCategoryFirst')} // Dynamic placeholder
              disabled={!selectedTagCategory} // Disable if no category selected
              InputProps={{
                ...params.InputProps,
                disableUnderline: true, // Remove underline for standard variant
                startAdornment: (
                  <>
                    <InputAdornment position="start" sx={{ pl: 1 }}>
                      {/* Use Phosphor MagnifyingGlass */}
                      <MagnifyingGlass size={20} color={theme.palette.action.active} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {tagFetchStatus[selectedTagCategory] === 'loading' ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{ // Adjust padding for standard variant
                '& .MuiInputBase-root': {
                  paddingTop: '2px',
                  paddingBottom: '2px',
                },
                 '& .MuiInputBase-input': {
                   padding: theme.spacing(1.5, 1, 1.5, 0), // Adjust padding
                   fontSize: '0.95rem',
                 },
              }}
            />
          )}
          // Remove sx prop from Autocomplete itself
        />
         {/* Add Button */}
         <IconButton
            onClick={handleAddTagClick}
            disabled={!tagSearchQuery.trim() || !selectedTagCategory || formValues.selectedTags.length >= 20}
            size="small"
            sx={{ ml: 0.5 }} // Margin left for spacing
            aria-label={t('common.addTag')} // Add translation key
          >
            <Plus size={20} weight="bold" />
          </IconButton>
      </StyledInputContainer>


       {/* Display ALL Selected Tags */}
       {formValues.selectedTags.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <AccessibleTypography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
            {t('onboarding.selectedTags')}
          </AccessibleTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 1.5 }}>
            {formValues.selectedTags.map((tag) => (
              <StyledChip
                key={`selected-${tag.type}-${tag.value}`} // Ensure unique key
                label={`${tag.value} (${t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)})`} // Show value and category type
                onDelete={() => {
                  // Remove tag from the main list
                  setFormValues(prev => ({
                    ...prev,
                    selectedTags: prev.selectedTags.filter(t => !(t.type === tag.type && t.value === tag.value))
                  }));
                }}
                color="secondary" // Use secondary color for selected tags
                size="medium" // Use medium size for better readability
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
            {/* Use Phosphor X */}
            <X size={20} />
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
