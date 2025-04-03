// Replace MUI Icons with Phosphor Icons
import {
  UserCircle,
  CheckCircle,
  X,
  Info,
  Sparkle, // Replacing InterestsIcon
  MagnifyingGlass, // Replacing SearchIcon
  Plus, // For the new Add button
  PencilSimple, // For editing profile picture
  UploadSimple, // For uploading profile picture
  Camera, // For camera option
  Check, // Added for Use Photo button
  ArrowCounterClockwise // Added for Retake button
} from '@phosphor-icons/react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
  Fade, // Added for transitions
  Slide, // Added for transitions
} from '@mui/material';
import { selectIdToken } from '@neurolink/shared/src/features/tokens/tokensSlice';
import { Tag, UserPreferences, UserProfileInput } from '@neurolink/shared/src/features/user/types';
// Import FetchTagsParams and uploadProfilePicture from the correct path
import { createUser, fetchTags, FetchTagsParams, uploadProfilePicture } from '@neurolink/shared/src/features/user/userAPI';
import { setOnboardingStatus } from '@neurolink/shared/src/features/user/userSlice';
import { jwtDecode } from 'jwt-decode';
import { debounce } from 'lodash'; // Added for debouncing search
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // Added useRef
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../app/api/apiClient';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import { useAppDispatch, useAppSelector } from '../../../app/store/initStore';
import Webcam from 'react-webcam'; // Import Webcam

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
  width: 150, // Increased size
  height: 150, // Increased size
  borderRadius: '50%',
  // Use a light primary background for the placeholder itself
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.light + '40' : theme.palette.primary.dark + '60', // Added transparency
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto',
  position: 'relative',
  border: `2px solid ${theme.palette.primary.main}`, // Keep primary color border
  cursor: 'pointer', // Make it clickable
  overflow: 'hidden', // Hide overflow for the overlay
  '&:hover .upload-overlay, &:focus-within .upload-overlay': { // Show overlay on hover/focus
    opacity: 1,
  },
}));

// Overlay for upload icon/progress
const UploadOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  opacity: 0, // Hidden by default
  transition: 'opacity 0.2s ease-in-out',
  borderRadius: '50%', // Match parent border radius
});

// Add styling for the button group below the avatar
const CameraActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  flexWrap: 'wrap', // Allow wrapping on small screens
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
  profilePicture: '', // Will store the URL from the API
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
  const [isCompleting, setIsCompleting] = useState(false); // NEW: State for completion transition

  // --- Profile Picture State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- Webcam specific state ---
  const [isCameraActive, setIsCameraActive] = useState(false); // NEW: Track if camera view is active
  const [stagedCapturedImage, setStagedCapturedImage] = useState<string | null>(null); // NEW: Temp storage for snapped pic
  const webcamRef = useRef<Webcam>(null);
  // --- End Profile Picture State ---


  // --- Tag Search State ---
  const [allTags, setAllTags] = useState<Record<string, Tag[]>>({}); // Store all fetched tags per category
  const [tagFetchStatus, setTagFetchStatus] = useState<Record<string, TagFetchStatus>>(
    () => Object.fromEntries(tagCategories.map(cat => [cat.type, 'idle']))
  );
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>(tagCategories[0]?.type || '');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [debouncedTagSearchQuery, setDebouncedTagSearchQuery] = useState<string>('');
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
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'error' }));
      toast.error(`${specificErrorMsg}: ${errorMessage || t('onboarding.error.loadingTagsGeneric')}`); // Show generic error if specific is missing
    }
  }, [t]);

  // Fetch tags when the selected category or debounced search query changes
  useEffect(() => {
    handleFetchCategoryTags(selectedTagCategory, debouncedTagSearchQuery);
  }, [selectedTagCategory, debouncedTagSearchQuery, handleFetchCategoryTags]);

  // Handle form input changes (for non-tag fields)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle tag category selection change
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedTagCategory(event.target.value);
    setTagSearchQuery('');
    setDebouncedTagSearchQuery('');
  };

  // Handle Autocomplete input change - update local state immediately, debounce the fetch trigger
  const handleTagInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setTagSearchQuery(newInputValue);
    if (event?.type === 'change') {
       debouncedSetQuery(newInputValue);
    }
  };


  // Handle adding/removing tags via Autocomplete
  const handleTagsChange = (_event: React.SyntheticEvent, newValue: (Tag | { inputValue: string; title: string } | string)[]) => {
    const newActualTags = newValue.filter(v => typeof v !== 'string' && !('inputValue' in v)) as Tag[];
    const otherCategoryTagsCount = formValues.selectedTags.filter(tag => tag.type !== selectedTagCategory).length;
    const potentialTotalCount = otherCategoryTagsCount + newActualTags.length;


    if (potentialTotalCount > 20) {
      toast.warn(t('onboarding.error.tagLimitReached', { max: 20 }));
       if (newActualTags.length > currentCategorySelectedTags.length) {
          return;
       }
    }


    setFormValues(prev => {
      const currentCategoryNewTags = newValue
        .map(option => {
          if (typeof option === 'string') {
            if (!option.trim()) return null;
            return { type: selectedTagCategory, value: option.trim() };
          }
          if (typeof option === 'object' && option && 'inputValue' in option) {
             if (!option.inputValue.trim()) return null;
            return { type: selectedTagCategory, value: option.inputValue.trim() };
          }
          if (typeof option === 'object' && option && 'type' in option && 'value' in option) {
            return option;
          }
          return null;
        })
        .filter(tag => tag !== null) as Tag[];

      const uniqueCurrentCategoryNewTags = currentCategoryNewTags.filter((tag, index, self) =>
        index === self.findIndex((t) => (
          t.value === tag.value
        ))
      );


      const otherCategoryTags = prev.selectedTags.filter(tag => tag.type !== selectedTagCategory);

      const updatedSelectedTags = [...otherCategoryTags, ...uniqueCurrentCategoryNewTags];

      if (updatedSelectedTags.length > 20) {
         updatedSelectedTags.length = 20;
      }


      return { ...prev, selectedTags: updatedSelectedTags };
    });
     setTagSearchQuery('');
     setDebouncedTagSearchQuery('');
  };

  // Handle clicking the explicit "Add" button
  const handleAddTagClick = () => {
    const valueToAdd = tagSearchQuery.trim();
    if (!valueToAdd) return;

    if (formValues.selectedTags.length >= 20) {
      toast.warn(t('onboarding.error.tagLimitReached', { max: 20 }));
      return;
    }

    const alreadySelected = formValues.selectedTags.some(tag => tag.value === valueToAdd && tag.type === selectedTagCategory);
    if (alreadySelected) {
      toast.info(t('onboarding.error.tagAlreadySelected', { tag: valueToAdd }));
      return;
    }

    setFormValues(prev => {
       const newTag: Tag = { type: selectedTagCategory, value: valueToAdd };
       const updatedSelectedTags = [...prev.selectedTags, newTag].slice(0, 20);
       return { ...prev, selectedTags: updatedSelectedTags };
    });

    setTagSearchQuery('');
    setDebouncedTagSearchQuery('');
  };


  // Filter selected tags for the current category to pass to Autocomplete value prop
  const currentCategorySelectedTags = useMemo(() => {
    return formValues.selectedTags.filter(tag => tag.type === selectedTagCategory);
  }, [formValues.selectedTags, selectedTagCategory]);


  // --- Profile Picture Upload Logic ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError(t('onboarding.error.invalidFileType'));
        toast.error(t('onboarding.error.invalidFileType'));
        return;
      }
      setIsCameraActive(false); // Deactivate camera if user uploads file
      setStagedCapturedImage(null); // Clear any staged image
      setSelectedFile(file); // This triggers the upload useEffect
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string); // Show preview immediately
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload effect remains the same (triggered by selectedFile change)
  useEffect(() => {
    if (!selectedFile) return;
    const upload = async () => {
      setIsUploading(true);
      setUploadError(null);
      try {
        const uploadedUrl = await uploadProfilePicture(apiClient, selectedFile);
        setFormValues(prev => ({ ...prev, profilePicture: uploadedUrl }));
        setPreviewUrl(uploadedUrl); // Update preview to final URL *after* upload
        toast.success(t('onboarding.success.pictureUploaded'));
      } catch (error) {
        const message = (error instanceof Error) ? error.message : t('onboarding.error.uploadFailedGeneric');
        setUploadError(message);
        toast.error(message);
        // Clear the file/preview if upload fails?
        // setSelectedFile(null);
        // setPreviewUrl(formValues.profilePicture || null); // Revert preview to last uploaded?
      } finally {
        setIsUploading(false);
      }
    };
    upload();
  }, [selectedFile, t, dispatch]); // Added dispatch to dependencies

  // --- Camera Logic (Refactored for inline view) ---

  // Helper function to convert base64 to Blob (remains the same)
   const dataURLtoBlob = (dataurl: string): Blob | null => {
      try {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch || mimeMatch.length < 2) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        return new Blob([u8arr], {type:mime});
      } catch (e) { console.error("Error converting data URL to blob:", e); return null; }
  }

  // Toggle camera view on/off
  const toggleCameraView = () => {
      setIsCameraActive(prev => !prev);
      setStagedCapturedImage(null); // Clear staged image when toggling
      // If turning off camera, maybe clear preview? Or keep last uploaded?
      // setPreviewUrl(formValues.profilePicture || null); // Example: revert to last uploaded
  };

  // Capture photo from webcam feed
  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setStagedCapturedImage(imageSrc); // Store captured image temporarily
      } else {
        console.error("Failed to get screenshot from webcam.");
        toast.error(t('onboarding.error.captureFailed'));
      }
    }
  }, [webcamRef, t]);

  // Use the staged captured photo
  const handleUseStagedImage = () => {
    if (stagedCapturedImage) {
      const blob = dataURLtoBlob(stagedCapturedImage);
      if (blob) {
          const capturedFile = new File([blob], `capture-${Date.now()}.png`, { type: blob.type || 'image/png' });
          setSelectedFile(capturedFile); // This triggers the upload useEffect
          setPreviewUrl(stagedCapturedImage); // Show captured image as main preview immediately
      } else {
         toast.error(t('onboarding.error.captureFailed'));
      }
      // Deactivate camera view and clear staged image regardless of blob success
      setIsCameraActive(false);
      setStagedCapturedImage(null);
    }
  };

  // Retake photo (clear staged image, keep camera active)
  const handleRetake = () => {
      setStagedCapturedImage(null);
  };

  // Cancel camera view (deactivate, clear staged)
   const handleCancelCamera = () => {
      setIsCameraActive(false);
      setStagedCapturedImage(null);
      // Maybe revert preview?
      // setPreviewUrl(formValues.profilePicture || null);
   }
  // --- End Camera Logic ---


  // Validate step before proceeding
  const validateStep = () => {
    if (activeStep === 0 && !formValues.displayName) {
      const errorMsg = t('onboarding.error.requiredDisplayName');
      setFormError(errorMsg);
      toast.warn(errorMsg);
      return false;
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
    setIsSubmitting(true); // Keep this to disable buttons immediately
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
      dispatch(setOnboardingStatus(true)); // Mark onboarding as done

      // Start completion transition instead of navigating immediately
      setIsCompleting(true);

      // Set a timeout to navigate after the animation
      setTimeout(() => {
        navigate('/'); // Navigate to home page
      }, 2500); // Delay matching animation duration (adjust as needed)

    } catch (err) {
      const errorMsg = t('onboarding.error.submitFailed');
      const detailedError = (err instanceof Error) ? err.message : String(err);
      setSubmitError(detailedError || errorMsg);
      toast.error(`${errorMsg}: ${detailedError}`);
      // Ensure submitting state is reset on error
      setIsSubmitting(false);
    }
    // Don't set isSubmitting back to false here if successful, keep buttons disabled
  };

  // Handle close/cancel
  const handleCancel = useCallback(() => {
    navigate('/');
    toast.info(t('onboarding.cancelled'));
  }, [navigate, t]);

  // --- Render Functions for Steps ---
  const renderBasicInfoForm = () => (
    <Box sx={{ mt: 4 }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
        id="profile-picture-upload"
      />
      {/* Combined Avatar/Webcam Area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <AvatarPlaceholder aria-label={t('onboarding.profilePicture')}>
              {/* Conditional Rendering Inside Placeholder */}
              {isCameraActive ? (
                  stagedCapturedImage ? (
                      // Show snapped photo
                      <img src={stagedCapturedImage} alt={t('onboarding.capture')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                      // Show live webcam feed
                      <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/png"
                          width="100%"
                          height="100%"
                          videoConstraints={{ facingMode: "user", width: 180, height: 180 }} // Constrain size
                          mirrored={true} // Mirror selfie view
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }} // Ensure it fills circle
                      />
                  )
              ) : (
                  // Show default view: Uploaded photo, preview, or fallback icon
                  <>
                      <Avatar
                          src={previewUrl || formValues.profilePicture || undefined}
                          alt={formValues.displayName || 'User'}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', bgcolor: 'transparent' }}
                      >
                          {!previewUrl && !formValues.profilePicture && <UserCircle size={60} color={theme.palette.primary.main} />}
                      </Avatar>
                      {/* Upload Overlay - show only when camera isn't active */}
                      {!isCameraActive && (
                           <UploadOverlay className="upload-overlay" onClick={() => fileInputRef.current?.click()}>
                               {isUploading ? <CircularProgress color="inherit" size={30} /> : (previewUrl || formValues.profilePicture ? <PencilSimple size={30} /> : <UploadSimple size={30} />)}
                           </UploadOverlay>
                      )}
                  </>
              )}
          </AvatarPlaceholder>


          {/* Action Buttons Below Avatar */}
          {!isCameraActive ? (
               <CameraActionButtons>
                    {/* Button to trigger file input */}
                    <Button variant="outlined" size="small" startIcon={<UploadSimple size={18}/>} onClick={() => fileInputRef.current?.click()}>
                        {t('onboarding.uploadFile')} {/* ADD TRANSLATION KEY */}
                    </Button>
                    {/* Button to activate camera view */}
                    <Button variant="outlined" size="small" startIcon={<Camera size={18} />} onClick={toggleCameraView}>
                        {t('onboarding.useCamera')}
                    </Button>
               </CameraActionButtons>
           ) : (
                // Buttons for when camera is active
                stagedCapturedImage ? (
                    // Buttons after capturing photo
                    <CameraActionButtons>
                        <Button variant="contained" size="small" startIcon={<Check size={18} />} onClick={handleUseStagedImage}>
                           {t('onboarding.usePhoto')}
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<ArrowCounterClockwise size={18} />} onClick={handleRetake}>
                           {t('onboarding.retake')} {/* ADD TRANSLATION KEY */}
                        </Button>
                    </CameraActionButtons>
                ) : (
                    // Buttons for live camera feed
                     <CameraActionButtons>
                        <Button variant="contained" size="small" startIcon={<Camera size={18} />} onClick={handleCapture}>
                           {t('onboarding.capture')}
                        </Button>
                        <Button variant="outlined" size="small" onClick={handleCancelCamera}>
                           {t('common.cancel')}
                        </Button>
                    </CameraActionButtons>
                )
           )}

           {/* Upload Error Message */}
          {uploadError && <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: '300px' }}>{uploadError}</Alert>}
      </Box>


      {/* Display Name Grid */}
      <Grid container spacing={3} sx={{ mt: 2 }}> {/* Add margin top */}
        <Grid item xs={12}>
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>{t('onboarding.displayName')}*</AccessibleTypography>
          <StyledTextField required fullWidth id="displayName" name="displayName" value={formValues.displayName} onChange={handleInputChange} error={!!formError && !formValues.displayName} helperText={t('onboarding.displayNameHelp')} aria-describedby="displayName-helper-text" />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAboutYouForm = () => (
    <Box sx={{ mt: 5 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <AccessibleTypography component="label" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>{t('onboarding.age')}</AccessibleTypography>
          <StyledTextField fullWidth id="age" name="age" label={t('onboarding.ageOptional')} type="number" value={formValues.age} onChange={handleInputChange} InputProps={{ inputProps: { min: 0, max: 120 } }} />
        </Grid>
        <Grid item xs={12}>
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
        {t('onboarding.selectCategoryAndAddTags')}
      </AccessibleTypography>

      <StyledInputContainer>
        <Select
          variant="standard"
          disableUnderline
          value={selectedTagCategory}
          onChange={handleCategoryChange}
          sx={{
            minWidth: 150,
            mr: 1,
            fontWeight: 500,
            fontSize: '0.9rem',
            '& .MuiSelect-select': {
              paddingRight: '24px !important',
              paddingLeft: '0px',
              paddingTop: '12px',
              paddingBottom: '12px',
            },
          }}
          MenuProps={{
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

        <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, height: '30px', alignSelf: 'center' }} />

        <Autocomplete<Tag | { inputValue: string; title: string }, true, false, true>
          multiple
          freeSolo
          fullWidth
          value={currentCategorySelectedTags}
          onChange={handleTagsChange}
          inputValue={tagSearchQuery}
          onInputChange={handleTagInputChange}
          options={allTags[selectedTagCategory] || []}
          loading={tagFetchStatus[selectedTagCategory] === 'loading'}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            if (option && 'inputValue' in option) {
              return option.title;
            }
            return option?.value || '';
          }}
          isOptionEqualToValue={(option, val) => {
             if (typeof option === 'object' && 'value' in option && typeof val === 'object' && 'value' in val) {
               return option.value === val.value && option.type === val.type;
             }
             return false;
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const { inputValue } = params;
            const isExistingSuggestion = options.some((option) => {
              if (typeof option === 'object' && option && 'value' in option && 'type' in option) {
                return option.value === inputValue;
              }
              return false;
            });
            const isAlreadySelected = currentCategorySelectedTags.some(tag => tag.value === inputValue);

            if (inputValue !== '' && !isExistingSuggestion && !isAlreadySelected) {
              filtered.push({
                inputValue: inputValue,
                title: `Add "${inputValue}"`,
              });
            }
            return filtered;
          }}
          renderOption={(props, option) => {
            if (typeof option === 'object' && 'title' in option) {
              return <li {...props}>{option.title}</li>;
            }
            if (typeof option === 'object' && 'value' in option) {
               return <li {...props}>{option.value}</li>;
            }
            return <li {...props}></li>;
          }}
          renderTags={() => null}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              placeholder={selectedTagCategory ? t('onboarding.searchOrAddTagPlaceholder') : t('onboarding.selectCategoryFirst')}
              disabled={!selectedTagCategory}
              InputProps={{
                ...params.InputProps,
                disableUnderline: true,
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
                    {tagFetchStatus[selectedTagCategory] === 'loading' ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '2px',
                  paddingBottom: '2px',
                },
                 '& .MuiInputBase-input': {
                   padding: theme.spacing(1.5, 1, 1.5, 0),
                   fontSize: '0.95rem',
                 },
              }}
            />
          )}
        />
         <IconButton
            onClick={handleAddTagClick}
            disabled={!tagSearchQuery.trim() || !selectedTagCategory || formValues.selectedTags.length >= 20}
            size="small"
            sx={{ ml: 0.5 }}
            aria-label={t('common.addTag')}
          >
            <Plus size={20} weight="bold" />
          </IconButton>
      </StyledInputContainer>


       {formValues.selectedTags.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <AccessibleTypography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
            {t('onboarding.selectedTags')}
          </AccessibleTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 1.5 }}>
            {formValues.selectedTags.map((tag) => (
              <StyledChip
                key={`selected-${tag.type}-${tag.value}`}
                label={`${tag.value} (${t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)})`}
                onDelete={() => {
                  setFormValues(prev => ({
                    ...prev,
                    selectedTags: prev.selectedTags.filter(t => !(t.type === tag.type && t.value === tag.value))
                  }));
                }}
                color="secondary"
                size="medium"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

   const renderReviewForm = () => (
    <Box sx={{ mt: 5 }}>
      <AccessibleTypography variant="h5" component="h2" gutterBottom sx={{ mb: 2, fontWeight: 500, textAlign: 'center' }}>{t('onboarding.reviewInfo')}</AccessibleTypography>

      {/* Display Uploaded Profile Picture - Centered at the top */}
      {formValues.profilePicture && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
           <Avatar src={formValues.profilePicture} alt={formValues.displayName || 'Profile'} sx={{ width: 100, height: 100 }} />
        </Box>
      )}

      {/* Basic Info Section - No Picture Here */}
      <Box sx={{ mb: 4, p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2 }}>
        <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t('onboarding.basicInfo')}</AccessibleTypography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}><Typography fontWeight="medium">{t('onboarding.displayName')}:</Typography></Grid>
          <Grid item xs={12} sm={8}><Typography>{formValues.displayName}</Typography></Grid>
          {formValues.age && (<>
            <Grid item xs={12} sm={4}><Typography fontWeight="medium">{t('onboarding.age')}:</Typography></Grid>
            <Grid item xs={12} sm={8}><Typography>{formValues.age}</Typography></Grid>
          </>)}
          {/* Removed profile picture grid items from here */}
        </Grid>
      </Box>

      {/* Bio Section */}
      {formValues.bio && (
        <Box sx={{ mb: 4, p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2 }}>
          <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t('onboarding.bio')}</AccessibleTypography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{formValues.bio}</Typography>
        </Box>
      )}

      {formValues.selectedTags.length > 0 && (
        <Box sx={{ mb: 4, p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius * 2 }}>
          <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>{t('onboarding.tags')}</AccessibleTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {formValues.selectedTags.map((tag, idx) => (
              <StyledChip
                key={`review-${tag.type}-${tag.value}-${idx}`}
                label={tag.value}
                title={t(tagCategories.find(c => c.type === tag.type)?.label || tag.type)}
                color="secondary"
                variant="filled"
                size="medium"
              />
            ))}
          </Box>
        </Box>
      )}

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
        {/* Wrap paper content in Fade for fade-out effect */}
        <Fade in={!isCompleting} timeout={500} unmountOnExit>
            <StyledPaper elevation={3}>
              {/* Close Button */}
              <IconButton onClick={handleCancel} disabled={isCompleting} sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }} aria-label={t('common.close')}>
                <X size={20} />
              </IconButton>

              {/* Stepper, Title, Form Error, Step Content */}
               {/* Conditionally render or hide/disable these during completion */}
                {!isCompleting && (
                    <>
                        <Stepper activeStep={activeStep} alternativeLabel connector={<QontoConnector />} sx={{ mb: 5 }}>
                           {steps.map((labelKey) => (
                                <Step key={labelKey}>
                                    <StepLabel StepIconComponent={QontoStepIcon}>{t(labelKey)}</StepLabel>
                                </Step>
                           ))}
                        </Stepper>
                        <AccessibleTypography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
                            {t(steps[activeStep])}
                        </AccessibleTypography>
                        {formError && !isSubmitting && (<Alert severity="warning" sx={{ mb: 3, borderRadius: theme.shape.borderRadius }}>{formError}</Alert>)}
                    </>
                )}

                {renderStepContent()}


              {/* Navigation Buttons - Disable during completion */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <ActionButton
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0 || isSubmitting || isCompleting} // Disable if completing
                  sx={{ color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' } }}
                >
                  {t('common.back')}
                </ActionButton>
                <ActionButton
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={isSubmitting || isCompleting} // Disable if completing
                  disableElevation
                >
                  {isSubmitting ? (<CircularProgress size={24} color="inherit" />) : (activeStep === steps.length - 1 ? t('onboarding.saveProfile') : t('common.next'))}
                </ActionButton>
              </Box>
            </StyledPaper>
          </Fade>

          {/* Welcome Message Animation - Appears when completing */}
          <Fade in={isCompleting} timeout={1000} style={{ transitionDelay: isCompleting ? '500ms' : '0ms' }}>
             <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  px: 3, // Add padding
                  pointerEvents: 'none', // Allow clicks through if needed
                }}
              >
                <Slide direction="up" in={isCompleting} timeout={1500} style={{ transitionDelay: isCompleting ? '600ms' : '0ms' }}>
                  <Typography
                     variant="h2" // Larger text
                     component="h1"
                     sx={{
                         color: 'common.white', // Ensure white text
                         fontWeight: 700,
                         textShadow: '0px 2px 4px rgba(0,0,0,0.5)' // Add subtle shadow
                     }}
                    >
                     {t('onboarding.welcomeMessage')}
                  </Typography>
                </Slide>
            </Box>
          </Fade>

      </Container>
    </ContentContainer>
  );
};

export default OnboardingContent;
