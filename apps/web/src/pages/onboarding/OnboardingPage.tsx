import React, { useState, useCallback } from 'react'; // Removed useEffect
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
  styled,
  Stepper,
  Step,
  StepLabel,
  Accordion,         // Added
  AccordionSummary,  // Added
  AccordionDetails // Added
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Added
import CloseIcon from '@mui/icons-material/Close';
import { fetchTags, createUser } from '@neurolink/shared/src/features/user/userAPI';
import { Tag, UserPreferences, UserProfileInput } from '@neurolink/shared/src/features/user/types';
import { selectIdToken } from '@neurolink/shared/src/features/tokens/tokensSlice';
import { useAppSelector, useAppDispatch } from '../../app/store/initStore';
import apiClient from '../../app/api/apiClient';
import { setOnboardingStatus } from '@neurolink/shared/src/features/user/userSlice';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import Breadcrumb from '../../app/components/Breadcrumb';
import { toast } from 'react-toastify';

// --- Styled Components (Keep existing ones) ---
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 16,
  boxShadow: theme.shadows[3],
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'visible',
  width: '100%',
  maxWidth: 750,
  margin: `${theme.spacing(4)} auto`
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : theme.palette.action.hover,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
  marginBottom: theme.spacing(2.5)
}));

const AvatarPlaceholder = styled(Box)(({ theme }) => ({
  width: 96,
  height: 96,
  borderRadius: '50%',
  backgroundColor: theme.palette.action.selected,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(3),
  position: 'relative'
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: 8,
  fontSize: '0.875rem',
  height: 36,
  padding: theme.spacing(0, 1.5),
  '&.MuiChip-outlined': {
    borderColor: theme.palette.divider,
  },
  '&.MuiChip-filled': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.25, 3),
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  minWidth: 120
}));
// --- End Styled Components ---

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

// Define steps for the Stepper
const steps = [
  'onboarding.stepBasicInfo',
  'onboarding.stepAboutYou',
  'onboarding.stepTagsInterests',
  'onboarding.stepReview'
];

// Initial form values
const initialFormValues = {
  displayName: '',
  profilePicture: '',
  age: '',
  bio: '',
  selectedTags: [] as Tag[],
  preferences: {
    visibility: 'public', // Changed default to public as per previous state
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

const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const idToken = useAppSelector(selectIdToken);
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for tags fetched per category
  const [tags, setTags] = useState<Record<string, Tag[]>>({});
  // State for tracking fetch status per category
  const [tagFetchStatus, setTagFetchStatus] = useState<Record<string, TagFetchStatus>>(
    () => Object.fromEntries(tagCategories.map(cat => [cat.type, 'idle']))
  );
  // State for storing fetch errors per category
  const [tagFetchError, setTagFetchError] = useState<Record<string, string | null>>(
     () => Object.fromEntries(tagCategories.map(cat => [cat.type, null]))
  );

  // --- REMOVED useEffect for initial tag fetch ---

  // Function to fetch tags for a specific category on demand
  const handleFetchCategoryTags = useCallback(async (categoryType: string) => {
    // Don't refetch if already loading or loaded successfully
    if (tagFetchStatus[categoryType] === 'loading' || tagFetchStatus[categoryType] === 'loaded') {
      return;
    }

    // Set status to loading and clear previous error
    setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loading' }));
    setTagFetchError(prev => ({ ...prev, [categoryType]: null }));

    try {
      const fetchedTags = await fetchTags(apiClient, { type: categoryType, limit: 5 }); // Fetch top 5
      setTags(prev => ({ ...prev, [categoryType]: fetchedTags }));
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loaded' }));
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      console.error(`Error fetching tags for ${categoryType}:`, errorMessage);
      setTagFetchError(prev => ({ ...prev, [categoryType]: errorMessage || t('onboarding.error.loadingTagsGeneric') }));
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'error' }));
      toast.error(t('onboarding.error.loadingTagsSpecific', { category: t(tagCategories.find(c => c.type === categoryType)?.label || categoryType) }) + `: ${errorMessage}`);
    }
  }, [t, tagFetchStatus]); // Include tagFetchStatus in dependencies

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

  // Validate step before proceeding
  const validateStep = () => {
    if (activeStep === 0) {
      if (!formValues.displayName) {
        setFormError(t('onboarding.error.requiredDisplayName'));
        toast.warn(t('onboarding.error.requiredDisplayName'));
        return false;
      }
    }
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
      console.error("Error decoding token:", err);
      setSubmitError(t('onboarding.error.invalidToken'));
      toast.error(t('onboarding.error.invalidToken'));
      setIsSubmitting(false);
      return;
    }

    if (!decodedToken.email) {
      setSubmitError(t('onboarding.error.noEmail'));
      toast.error(t('onboarding.error.noEmail'));
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
      navigate('/profile');

    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : String(err);
      setSubmitError(errorMessage || t('onboarding.error.submitFailed'));
      toast.error(t('onboarding.error.submitFailed') + `: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close/cancel
  const handleCancel = useCallback(() => {
    navigate('/');
    toast.info(t('onboarding.cancelled'));
  }, [navigate, t]);

  // --- Render Functions for Steps ---

  // Step 1: Basic information form
  const renderBasicInfoForm = () => (
    <Box sx={{ mt: 4 }}>
      <AvatarPlaceholder>
        {formValues.profilePicture ? (
          <Avatar
            src={formValues.profilePicture}
            alt={formValues.displayName || 'User'}
            sx={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'transparent', color: 'text.secondary' }}>
            <Typography variant="h3" component="span">👤</Typography>
          </Avatar>
        )}
      </AvatarPlaceholder>
      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
            {t('onboarding.displayName')}*
          </AccessibleTypography>
          <StyledTextField
            required
            fullWidth
            id="displayName"
            name="displayName"
            value={formValues.displayName}
            onChange={handleInputChange}
            error={!!formError && !formValues.displayName}
            helperText={t('onboarding.displayNameHelp')}
            aria-describedby="displayName-helper-text"
          />
        </Grid>
        <Grid item xs={12}>
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
            {t('onboarding.profilePictureUrl')}
          </AccessibleTypography>
          <StyledTextField
            fullWidth
            id="profilePicture"
            name="profilePicture"
            value={formValues.profilePicture}
            onChange={handleInputChange}
            helperText={t('onboarding.profilePictureHelp')}
            aria-describedby="profilePicture-helper-text"
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Step 2: About you form
  const renderAboutYouForm = () => (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
            {t('onboarding.age')}
          </AccessibleTypography>
          <StyledTextField
            fullWidth
            id="age"
            name="age"
            label={t('onboarding.ageOptional')}
            type="number"
            value={formValues.age}
            onChange={handleInputChange}
            InputProps={{ inputProps: { min: 0, max: 120 } }}
          />
        </Grid>
        <Grid item xs={12}>
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
            {t('onboarding.bio')}
          </AccessibleTypography>
          <StyledTextField
            fullWidth
            id="bio"
            name="bio"
            label={t('onboarding.bioOptional')}
            multiline
            rows={4}
            value={formValues.bio}
            onChange={handleInputChange}
            helperText={t('onboarding.bioHelp')}
            inputProps={{ maxLength: 500 }}
            aria-describedby="bio-helper-text"
          />
          <AccessibleTypography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
            aria-live="polite"
          >
            {t('onboarding.charCount', { count: formValues.bio?.length || 0, max: 500 })}
          </AccessibleTypography>
        </Grid>
      </Grid>
    </Box>
  );

  // Step 3: Tags form (Using Accordions for on-demand loading)
  const renderTagsForm = () => (
    <Box sx={{ mt: 4 }}>
      <AccessibleTypography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {t('onboarding.selectTagsHelp')}
      </AccessibleTypography>
      <AccessibleTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('onboarding.expandToLoad')} {/* Add new i18n key */}
      </AccessibleTypography>

      <Box>
        {/* Removed unused index from map */}
        {tagCategories.map((category) => (
          <Accordion
            key={category.type}
            sx={{
              boxShadow: 'none',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              '&:not(:last-child)': { mb: 1.5 },
              '&:before': { display: 'none' }, // Remove default separator
              '&.Mui-expanded': { margin: 0, '&:not(:last-child)': { mb: 1.5 } } // Prevent margin change on expand
            }}
            onChange={(_event, isExpanded) => {
              if (isExpanded) {
                handleFetchCategoryTags(category.type); // Fetch on expand if needed
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${category.type}-content`}
              id={`${category.type}-header`}
              sx={{ '& .MuiAccordionSummary-content': { fontWeight: 500 } }}
            >
              <AccessibleTypography>{t(category.label)}</AccessibleTypography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {tagFetchStatus[category.type] === 'loading' && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {tagFetchStatus[category.type] === 'error' && (
                <Alert severity="error" sx={{ borderRadius: 2, mt: 1 }}>
                  {tagFetchError[category.type] || t('onboarding.error.loadingTagsGeneric')}
                </Alert>
              )}
              {tagFetchStatus[category.type] === 'loaded' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}>
                  {(tags[category.type] || []).length > 0 ? (
                    (tags[category.type] || []).map((tag, idx) => (
                      <StyledChip
                        key={`${tag.type}-${tag.value}-${idx}`}
                        label={tag.value}
                        onClick={() => handleTagToggle(tag)}
                        color="primary"
                        variant={isTagSelected(tag) ? "filled" : "outlined"}
                        clickable
                      />
                    ))
                  ) : (
                    <AccessibleTypography variant="body2" color="text.secondary">
                      {t('onboarding.noTagsAvailable')}
                    </AccessibleTypography>
                  )}
                </Box>
              )}
               {/* Idle state shows nothing in details, user needs to expand */}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );

  // Step 4: Review form
  const renderReviewForm = () => (
    <Box sx={{ mt: 4 }}>
      <AccessibleTypography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {t('onboarding.reviewInfo')}
      </AccessibleTypography>

      <Box sx={{ mb: 4 }}>
        <AccessibleTypography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          {t('onboarding.basicInfo')}
        </AccessibleTypography>
        <Grid container spacing={1} sx={{ pl: 1 }}>
          <Grid item xs={4}><Typography fontWeight="medium">{t('onboarding.displayName')}:</Typography></Grid>
          <Grid item xs={8}><Typography>{formValues.displayName}</Typography></Grid>
          {formValues.age && (
            <>
              <Grid item xs={4}><Typography fontWeight="medium">{t('onboarding.age')}:</Typography></Grid>
              <Grid item xs={8}><Typography>{formValues.age}</Typography></Grid>
            </>
          )}
          {formValues.profilePicture && (
             <>
              <Grid item xs={4}><Typography fontWeight="medium">{t('onboarding.profilePicture')}:</Typography></Grid>
              <Grid item xs={8}><Typography sx={{ wordBreak: 'break-all' }}>{formValues.profilePicture}</Typography></Grid>
            </>
          )}
        </Grid>
      </Box>

      {formValues.bio && (
        <Box sx={{ mb: 4 }}>
          <AccessibleTypography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
            {t('onboarding.bio')}
          </AccessibleTypography>
          <Typography sx={{ pl: 1 }}>{formValues.bio}</Typography>
        </Box>
      )}

      {formValues.selectedTags.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <AccessibleTypography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'medium', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
            {t('onboarding.tags')}
          </AccessibleTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pl: 1 }}>
            {formValues.selectedTags.map((tag, idx) => (
              <StyledChip
                key={`review-${tag.type}-${tag.value}-${idx}`}
                label={tag.value}
                title={t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)}
                color="primary"
                variant="filled"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          {submitError}
        </Alert>
      )}
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

  // Define breadcrumb items
  const breadcrumbItems = [
    { label: t('nav.home'), path: '/' },
    { label: t('onboarding.title'), path: '/onboarding' }
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumb customItems={breadcrumbItems} />
      </Box>

      <StyledPaper elevation={3}>
        <IconButton
          onClick={handleCancel}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' }
          }}
          aria-label={t('common.close')}
        >
          <CloseIcon />
        </IconButton>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((labelKey) => (
            <Step key={labelKey}>
              <StepLabel>{t(labelKey)}</StepLabel>
            </Step>
          ))}
        </Stepper>

         <AccessibleTypography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
           {t(steps[activeStep])}
         </AccessibleTypography>
         <Divider sx={{ mb: 3 }}/>

        {formError && !isSubmitting && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            {formError}
          </Alert>
        )}

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: 1, borderColor: 'divider' }}>
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
            {t('common.back')}
          </ActionButton>

          <ActionButton
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={isSubmitting}
            disableElevation
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              activeStep === steps.length - 1 ? t('onboarding.saveProfile') : t('common.next')
            )}
          </ActionButton>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default OnboardingPage;
