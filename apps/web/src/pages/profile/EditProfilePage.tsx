import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Removed unused useSelector
import {
  Box, Button, TextField, Container, CircularProgress, Alert, Avatar, Grid, Select, MenuItem, Chip, Autocomplete, createFilterOptions, InputAdornment, IconButton, SelectChangeEvent, useTheme, Paper, FormControl, InputLabel // Added FormControl, InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../app/store/initStore'; // Use App specific hooks
import { selectCurrentUser, fetchUser } from '@neurolink/shared/src/features/user/userSlice';
// Removed useUpdateUserMutation import
import { UserUpdate, Tag } from '@neurolink/shared/src/features/user/types';
import { fetchTags, FetchTagsParams, uploadProfilePicture } from '@neurolink/shared/src/features/user/userAPI'; // Import tag/upload functions
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { toast } from 'react-toastify';
import apiClient from '../../app/api/apiClient'; // Import apiClient
import { debounce } from 'lodash';
import { UserCircle, PencilSimple, UploadSimple, Camera, Check, ArrowCounterClockwise, MagnifyingGlass, Plus } from '@phosphor-icons/react'; // Import icons
import Webcam from 'react-webcam'; // Import Webcam

// Define tag categories (copied from OnboardingContent)
const tagCategories = [
  { type: 'programOfStudy', label: 'onboarding.programOfStudy' },
  { type: 'yearLevel', label: 'onboarding.yearLevel' },
  { type: 'neurodivergence', label: 'onboarding.neurodivergenceStatus' },
  { type: 'interest', label: 'onboarding.interests' },
  { type: 'skill', label: 'onboarding.skills' },
  { type: 'language', label: 'onboarding.languages' },
  { type: 'course', label: 'onboarding.courses' },
];

// Define tag fetching status type
type TagFetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

// Styled components (can be moved to a separate file later)
// Removed unused StyledTextField
const AvatarPlaceholder = Box; // Placeholder
const UploadOverlay = Box; // Placeholder
const CameraActionButtons = Box; // Placeholder
const StyledChip = Chip; // Placeholder
const StyledInputContainer = Box; // Placeholder

const EditProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  // Removed useUpdateUserMutation hook call
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for submission loading
  const [submitError, setSubmitError] = useState<string | null>(null); // Local state for submission error

  // Initialize state matching UserUpdate structure
  const [formData, setFormData] = useState<UserUpdate>({
    displayName: '',
    visibility: 'public', // Default visibility
    profilePicture: '',
    age: undefined,
    bio: '',
    tags: [],
    preferences: '', // Keep as string based on UserUpdate
  });

  // --- Profile Picture State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stagedCapturedImage, setStagedCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  // --- End Profile Picture State ---

  // --- Tag Search State ---
  const [allTags, setAllTags] = useState<Record<string, Tag[]>>({});
  const [tagFetchStatus, setTagFetchStatus] = useState<Record<string, TagFetchStatus>>(
    () => Object.fromEntries(tagCategories.map((cat: { type: string }) => [cat.type, 'idle'])) // Added type for cat
  );
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>(tagCategories[0]?.type || '');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [debouncedTagSearchQuery, setDebouncedTagSearchQuery] = useState<string>('');
  const filter = createFilterOptions<Tag | { inputValue: string; title: string }>();
  // --- End Tag Search State ---

  // Populate form data from current user
  useEffect(() => {
    if (currentUser) {
      // Access visibility through preferences object
      const currentVisibility = currentUser.preferences?.visibility || 'public';
      // Stringify preferences object if needed for the 'preferences' string field, or handle differently
      const currentPreferencesString = typeof currentUser.preferences === 'object'
          ? JSON.stringify(currentUser.preferences) // Example: stringify if API expects stringified JSON
          : currentUser.preferences || ''; // Fallback if it's already a string or null/undefined

      setFormData({
        displayName: currentUser.displayName || '',
        visibility: currentVisibility, // Set visibility from preferences
        profilePicture: currentUser.profilePicture || '',
        age: currentUser.age ?? undefined,
        bio: currentUser.bio || '',
        tags: currentUser.tags || [],
        preferences: currentPreferencesString, // Use the processed string
      });
      setPreviewUrl(currentUser.profilePicture || null);
    }
  }, [currentUser]);

  // --- Debounced Tag Fetching ---
  const debouncedSetQuery = useMemo(
    () => debounce((query: string) => setDebouncedTagSearchQuery(query), 300),
    []
  );

  const handleFetchCategoryTags = useCallback(async (categoryType: string, query: string) => {
    if (!categoryType) return;
    setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loading' }));
    try {
      const fetchParams: FetchTagsParams = { type: categoryType, limit: 20 };
      if (query) fetchParams.value = query;
      const fetchedTags = await fetchTags(apiClient, fetchParams);
      setAllTags(prev => ({ ...prev, [categoryType]: fetchedTags }));
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'loaded' }));
    } catch (error) {
      console.error(`Error fetching tags for ${categoryType}:`, error);
      setTagFetchStatus(prev => ({ ...prev, [categoryType]: 'error' }));
      toast.error(t('editProfile.error.loadingTags', { category: categoryType })); // Add translation
    }
  }, [t]);

  useEffect(() => {
    handleFetchCategoryTags(selectedTagCategory, debouncedTagSearchQuery);
  }, [selectedTagCategory, debouncedTagSearchQuery, handleFetchCategoryTags]);
  // --- End Debounced Tag Fetching ---

  // --- Form Input Handlers ---
  // --- Form Input Handlers ---
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    setFormData((prevData: UserUpdate) => ({ // Added type for prevData
      ...prevData,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  // Specific handler for Select components
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData((prevData: UserUpdate) => ({ // Added type for prevData
      ...prevData,
      [name]: value, // Directly use value for Select
    }));
  };

  // Handler for tag category select
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedTagCategory(event.target.value);
    setTagSearchQuery('');
    setDebouncedTagSearchQuery('');
  };

  const handleTagInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setTagSearchQuery(newInputValue);
    if (event?.type === 'change') {
       debouncedSetQuery(newInputValue);
    }
  };

  // Handler for Autocomplete tag changes
  const handleTagsChange = (_event: React.SyntheticEvent, newValue: (Tag | { inputValue: string; title: string } | string)[]) => {
    const maxTags = 20;
    // Ensure 'v' is checked for null/undefined before accessing properties
    const newActualTags = newValue.filter((v): v is Tag => typeof v === 'object' && v !== null && 'type' in v && 'value' in v);
    const otherCategoryTagsCount = formData.tags?.filter((tag: Tag) => tag.type !== selectedTagCategory).length || 0; // Added null check and type
    const potentialTotalCount = otherCategoryTagsCount + newActualTags.length;

    if (potentialTotalCount > maxTags) {
      toast.warn(t('editProfile.error.tagLimitReached', { max: maxTags }));
      if (newActualTags.length > currentCategorySelectedTags.length) {
        return;
      }
    }

    setFormData((prev: UserUpdate) => { // Added type for prev
      const currentCategoryNewTags = newValue
        .map((option): Tag | null => { // Added return type hint
          if (typeof option === 'string') return { type: selectedTagCategory, value: option.trim() };
          // Check option before accessing 'inputValue'
          if (typeof option === 'object' && option && 'inputValue' in option) return { type: selectedTagCategory, value: option.inputValue.trim() };
          // Check option before accessing 'type' and 'value'
          if (typeof option === 'object' && option && 'type' in option && 'value' in option) return option as Tag;
          return null;
        })
        .filter((tag): tag is Tag => tag !== null && !!tag.value); // Type guard for filtering nulls

      const uniqueCurrentCategoryNewTags = currentCategoryNewTags.filter((tag: Tag, index: number, self: Tag[]) => // Added types
        index === self.findIndex((t: Tag) => t.value === tag.value) // Added type for t
      );

      const otherCategoryTags = prev.tags?.filter((tag: Tag) => tag.type !== selectedTagCategory) || []; // Added null check and type
      const updatedSelectedTags = [...otherCategoryTags, ...uniqueCurrentCategoryNewTags].slice(0, maxTags);

      return { ...prev, tags: updatedSelectedTags };
    });
    setTagSearchQuery('');
    setDebouncedTagSearchQuery('');
  };

  const handleAddTagClick = () => {
    const valueToAdd = tagSearchQuery.trim();
    if (!valueToAdd) return;
    const maxTags = 20;

    if ((formData.tags?.length || 0) >= maxTags) { // Added null check
      toast.warn(t('editProfile.error.tagLimitReached', { max: maxTags }));
      return;
    }

    const alreadySelected = formData.tags?.some((tag: Tag) => tag.value === valueToAdd && tag.type === selectedTagCategory); // Added type
    if (alreadySelected) {
      toast.info(t('editProfile.error.tagAlreadySelected', { tag: valueToAdd }));
      return;
    }

    setFormData((prev: UserUpdate) => { // Added type
      const newTag: Tag = { type: selectedTagCategory, value: valueToAdd };
      const updatedSelectedTags = [...(prev.tags || []), newTag].slice(0, maxTags); // Added null check
      return { ...prev, tags: updatedSelectedTags };
    });

    setTagSearchQuery('');
    setDebouncedTagSearchQuery('');
  };

  // Memoized selected tags for the current category
  const currentCategorySelectedTags = useMemo(() => {
    return formData.tags?.filter((tag: Tag) => tag.type === selectedTagCategory) || []; // Added null check and type
  }, [formData.tags, selectedTagCategory]);
  // --- End Form Input Handlers ---

  // --- Profile Picture Logic (Copied & Adapted from Onboarding) ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError(t('editProfile.error.invalidFileType')); // Add translation
        toast.error(t('editProfile.error.invalidFileType'));
        return;
      }
      setIsCameraActive(false);
      setStagedCapturedImage(null);
      setSelectedFile(file); // Triggers upload useEffect
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!selectedFile) return;
    const upload = async () => {
      setIsUploading(true);
      setUploadError(null);
      try {
        const uploadedUrl = await uploadProfilePicture(apiClient, selectedFile);
        setFormData((prev: UserUpdate) => ({ ...prev, profilePicture: uploadedUrl })); // Added type
        setPreviewUrl(uploadedUrl);
        toast.success(t('editProfile.success.pictureUploaded'));
      } catch (error) {
        const message = (error instanceof Error) ? error.message : t('editProfile.error.uploadFailedGeneric');
        setUploadError(message);
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    };
    upload();
  }, [selectedFile, t]);

  const dataURLtoBlob = (dataurl: string): Blob | null => { /* ... (same as onboarding) ... */
      try {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch || mimeMatch.length < 2) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new Blob([u8arr], { type: mime });
      } catch (e) { console.error("Error converting data URL to blob:", e); return null; }
  };
  const toggleCameraView = () => setIsCameraActive((prev: boolean) => !prev); // Added type
  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setStagedCapturedImage(imageSrc);
      } else {
        toast.error(t('editProfile.error.captureFailed'));
      }
    }
  }, [webcamRef, t]);
  const handleUseStagedImage = () => {
    if (stagedCapturedImage) {
      const blob = dataURLtoBlob(stagedCapturedImage);
      if (blob) {
          const capturedFile = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          setSelectedFile(capturedFile);
          setPreviewUrl(stagedCapturedImage);
      } else {
         toast.error(t('editProfile.error.captureFailed'));
      }
      setIsCameraActive(false);
      setStagedCapturedImage(null);
    }
  };
  const handleRetake = () => setStagedCapturedImage(null);
  const handleCancelCamera = () => { setIsCameraActive(false); setStagedCapturedImage(null); };
  // --- End Profile Picture Logic ---


  // --- Form Submission ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Basic validation
    if (!formData.displayName) {
        toast.error(t('editProfile.error.requiredDisplayName')); // Add translation
        return;
    }

    // Construct payload, ensuring optional fields are handled
    const updatePayload: UserUpdate = {
        displayName: formData.displayName,
        // Only include fields if they have changed or are non-empty? API might handle nulls.
        // Let's send all fields for now, assuming API handles partial updates correctly.
        visibility: formData.visibility, // Send flat visibility field as per UserUpdate
        profilePicture: formData.profilePicture,
        age: formData.age,
        bio: formData.bio,
        tags: formData.tags,
        preferences: formData.preferences, // Send string preferences as per UserUpdate
    };

    setIsSubmitting(true); // Set loading state
    setSubmitError(null); // Clear previous errors

    try {
      // Use apiClient directly for PATCH request
      await apiClient.patch('/users/me', updatePayload); // Use PATCH and correct endpoint, removed unused response assignment
      toast.success(t('editProfile.success.profileUpdated'));
      // Refetch user data to update the store
      dispatch(fetchUser({ apiClient }));
      // Clear local error state on success
      setSubmitError(null);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorData = err as { response?: { data?: { detail?: string; title?: string; }; status?: number; }; message?: string };
      // Extract error message from Axios error structure
      const apiErrorDetail = errorData?.response?.data?.detail || errorData?.response?.data?.title;
      const fallbackMessage = errorData?.message || t('editProfile.error.updateFailedGeneric');
      const errorDetail = apiErrorDetail || fallbackMessage;
      setSubmitError(errorDetail); // Set local error state
      toast.error(`${t('editProfile.error.updateFailed')}: ${errorDetail}`);
    } finally {
      setIsSubmitting(false); // Reset loading state regardless of outcome
    }
  };
  // --- End Form Submission ---

  if (!currentUser) {
    // Show loading state while initial user data is fetched
    return (
        <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress />
        </Container>
    );
  }

  // Use local submitError state for displaying error
  // const updateErrorMessage = ... (removed)

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}> {/* Use lg for more space */}
       <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 } }}> {/* Add Paper for background/padding */}
        <AccessibleTypography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          {t('editProfile.title')}
        </AccessibleTypography>

        {/* Display local submitError */}
        {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
                {t('editProfile.error.updateFailed')}: {submitError}
            </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>

            {/* Profile Picture Section */}
            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                {/* Hidden File Input */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} id="profile-picture-upload" />
                {/* Avatar/Webcam Area */}
                <AvatarPlaceholder sx={{ width: 120, height: 120, mb: 1, borderRadius: '50%', border: `2px solid ${theme.palette.divider}`, position: 'relative', overflow: 'hidden', cursor: 'pointer', '&:hover .upload-overlay': { opacity: 1 } }}>
                    {isCameraActive ? (
                        stagedCapturedImage ? (
                            <img src={stagedCapturedImage} alt={t('editProfile.captureAlt')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/png" width="100%" height="100%" videoConstraints={{ facingMode: "user", width: 180, height: 180 }} mirrored={true} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )
                    ) : (
                        <>
                            <Avatar src={previewUrl || undefined} alt={formData.displayName || 'User'} sx={{ width: '100%', height: '100%', bgcolor: 'transparent' }}>
                                {!previewUrl && <UserCircle size={60} color={theme.palette.text.secondary} />}
                            </Avatar>
                            {!isCameraActive && (
                                <UploadOverlay className="upload-overlay" onClick={() => fileInputRef.current?.click()} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%' }}>
                                    {isUploading ? <CircularProgress color="inherit" size={30} /> : (previewUrl ? <PencilSimple size={30} /> : <UploadSimple size={30} />)}
                                </UploadOverlay>
                            )}
                        </>
                    )}
                </AvatarPlaceholder>
                {/* Action Buttons */}
                {!isCameraActive ? (
                    <CameraActionButtons sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" startIcon={<UploadSimple size={16}/>} onClick={() => fileInputRef.current?.click()}>{t('editProfile.uploadFile')}</Button>
                        <Button size="small" variant="outlined" startIcon={<Camera size={16} />} onClick={toggleCameraView}>{t('editProfile.useCamera')}</Button>
                    </CameraActionButtons>
                ) : (
                    stagedCapturedImage ? (
                        <CameraActionButtons sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" startIcon={<Check size={16} />} onClick={handleUseStagedImage}>{t('editProfile.usePhoto')}</Button>
                            <Button size="small" variant="outlined" startIcon={<ArrowCounterClockwise size={16} />} onClick={handleRetake}>{t('editProfile.retake')}</Button>
                        </CameraActionButtons>
                    ) : (
                        <CameraActionButtons sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" startIcon={<Camera size={16} />} onClick={handleCapture}>{t('editProfile.capture')}</Button>
                            <Button size="small" variant="outlined" onClick={handleCancelCamera}>{t('common.cancel')}</Button>
                        </CameraActionButtons>
                    )
                )}
                {uploadError && <Alert severity="error" sx={{ mt: 1, width: '100%', maxWidth: '300px' }}>{uploadError}</Alert>}
            </Grid>

            {/* Display Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="displayName"
                label={t('editProfile.displayNameLabel')}
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                autoFocus
              />
            </Grid>

            {/* Age */}
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                fullWidth
                id="age"
                label={t('editProfile.ageLabel')}
                name="age"
                type="number"
                value={formData.age ?? ''} // Handle undefined for empty input
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <TextField
                margin="normal"
                fullWidth
                id="bio"
                label={t('editProfile.bioLabel')}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                multiline
                rows={4}
                inputProps={{ maxLength: 500 }}
                helperText={t('editProfile.charCount', { count: formData.bio?.length || 0, max: 500 })} // Add translation
              />
            </Grid>

            {/* Visibility */}
            {/* Visibility */}
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                    <InputLabel id="visibility-select-label">{t('editProfile.visibilityLabel')}</InputLabel>
                    <Select
                        labelId="visibility-select-label"
                        id="visibility"
                        name="visibility" // Name matches formData key
                        value={formData.visibility || 'public'} // Ensure value is controlled
                        label={t('editProfile.visibilityLabel')}
                        onChange={handleSelectChange} // Use correct handler
                    >
                        <MenuItem value="public">{t('editProfile.visibilityPublic')}</MenuItem>
                        <MenuItem value="friends">{t('editProfile.visibilityFriends')}</MenuItem>
                        <MenuItem value="private">{t('editProfile.visibilityPrivate')}</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            {/* Preferences (Placeholder - kept as disabled TextField) */}
            <Grid item xs={12} sm={6}>
                 <TextField
                    margin="normal"
                    fullWidth
                    id="preferences"
                    label={t('editProfile.preferencesLabel')}
                    name="preferences"
                    value={formData.preferences} // Display the stringified value (or empty)
                    onChange={handleChange} // Keep standard handler (though disabled)
                    disabled
                    helperText={t('editProfile.preferencesHelp')}
                 />
            </Grid>

            {/* Tags Section */}
            <Grid item xs={12}>
                <AccessibleTypography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
                    {t('editProfile.tagsLabel')} {/* Add translation */}
                </AccessibleTypography>
                <StyledInputContainer sx={{ display: 'flex', alignItems: 'center', borderRadius: 1, border: `1px solid ${theme.palette.divider}`, p: 0.5, mb: 1 }}>
                    <Select
                        variant="standard"
                        disableUnderline
                        value={selectedTagCategory}
                        onChange={handleCategoryChange}
                        sx={{ minWidth: 150, mr: 1, fontWeight: 500, fontSize: '0.9rem', '& .MuiSelect-select': { px: 1, py: 1.2 } }}
                    >
                        {tagCategories.map((category: { type: string; label: string }) => ( // Added type
                            <MenuItem key={category.type} value={category.type}>{t(category.label)}</MenuItem>
                        ))}
                    </Select>
                    <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, height: '30px', alignSelf: 'center', mx: 1 }} />
                    <Autocomplete<Tag | { inputValue: string; title: string }, true, false, true>
                        multiple freeSolo fullWidth
                        value={currentCategorySelectedTags}
                        onChange={handleTagsChange}
                        inputValue={tagSearchQuery}
                        onInputChange={handleTagInputChange}
                        options={allTags[selectedTagCategory] || []}
                        loading={tagFetchStatus[selectedTagCategory] === 'loading'}
                        getOptionLabel={(option) => typeof option === 'string' ? option : (option && 'inputValue' in option ? option.title : option?.value || '')}
                        isOptionEqualToValue={(option, val) => typeof option === 'object' && option !== null && 'value' in option && typeof val === 'object' && val !== null && 'value' in val ? option.value === val.value && option.type === val.type : false} // Added null checks
                        filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            const { inputValue } = params;
                            // Ensure opt is an object with 'value' before accessing
                            const isExisting = options.some(opt => typeof opt === 'object' && opt !== null && 'value' in opt && opt.value === inputValue);
                            const isSelected = currentCategorySelectedTags.some((tag: Tag) => tag.value === inputValue); // Added type
                            if (inputValue && !isExisting && !isSelected) filtered.push({ inputValue, title: `Add "${inputValue}"` });
                            return filtered;
                        }}
                        renderOption={(props, option) => <li {...props}>{typeof option === 'object' && option !== null && 'title' in option ? option.title : (typeof option === 'object' && option !== null && 'value' in option ? option.value : '')}</li>} // Added null checks
                        renderTags={() => null}
                        renderInput={(params) => (
                            <TextField
                                {...params} variant="standard"
                                placeholder={selectedTagCategory ? t('editProfile.searchOrAddTagPlaceholder') : t('editProfile.selectCategoryFirst')}
                                disabled={!selectedTagCategory}
                                InputProps={{
                                    ...params.InputProps, disableUnderline: true,
                                    startAdornment: <InputAdornment position="start" sx={{ pl: 0.5 }}><MagnifyingGlass size={20} /></InputAdornment>,
                                    endAdornment: <>{tagFetchStatus[selectedTagCategory] === 'loading' ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> : null}{params.InputProps.endAdornment}</>
                                }}
                                sx={{ '& .MuiInputBase-input': { py: 1.2, fontSize: '0.95rem' } }}
                            />
                        )}
                    />
                    <IconButton onClick={handleAddTagClick} disabled={!tagSearchQuery.trim() || !selectedTagCategory || (formData.tags?.length || 0) >= 20} size="small" sx={{ ml: 0.5 }} aria-label={t('common.addTag')}> {/* Added null check */}
                        <Plus size={20} weight="bold" />
                    </IconButton>
                </StyledInputContainer>
                {/* Display Selected Tags */}
                {(formData.tags?.length || 0) > 0 && ( // Added null check
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1, minHeight: 40 }}>
                        {formData.tags?.map((tag: Tag) => ( // Added type
                            <StyledChip
                                key={`selected-${tag.type}-${tag.value}`}
                                label={`${tag.value} (${t(tagCategories.find((c: { type: string }) => c.type === tag.type)?.label || tag.type)})`} // Added type for c
                                onDelete={() => setFormData((prev: UserUpdate) => ({ ...prev, tags: prev.tags?.filter((t: Tag) => !(t.type === tag.type && t.value === tag.value)) }))} // Added types
                                size="small"
                            />
                        ))}
                    </Box>
                )}
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isUploading} // Use local isSubmitting state
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null} // Use local isSubmitting state
              >
                {t('editProfile.saveButton')}
              </Button>
            </Grid>

          </Grid> {/* End Grid container */}
        </Box> {/* End Form */}
       </Paper> {/* End Paper */}
    </Container>
  );
};

export default EditProfilePage;
