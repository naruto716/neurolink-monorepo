import React, { useState, useRef, useEffect, ChangeEvent, ClipboardEvent } from 'react'; 
import { Avatar, Box, Button, Paper, TextField, CircularProgress, Alert, IconButton, Divider, Popover, useTheme, Typography, Grid, LinearProgress, Select, MenuItem } from '@mui/material'; // Removed FormControl
import { useAppDispatch, useAppSelector } from '../../../app/store/initStore';
import { selectCurrentUser, requestFeedRefresh } from '@neurolink/shared'; 
import apiClient from '../../../app/api/apiClient';
import { useTranslation } from 'react-i18next';
import { Smiley, Image as ImageIcon, X, GlobeHemisphereWest, Users, Lock } from '@phosphor-icons/react'; // Import X instead of XCircle, added GlobeHemisphereWest, Users, Lock
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react'; 

// Define structure for uploaded media result
interface UploadedMedia {
  url: string;
  type: string; // Corresponds to contentType from API
}

// Define structure for tracking individual file state
interface MediaFileState {
  id: string; // Unique identifier for the file entry
  file: File;
  previewUrl: string | null;
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  uploadedMedia: UploadedMedia | null;
  error: string | null;
}

// Define allowed visibility types
type PostVisibility = 'public' | 'connections' | 'private';

const MAX_MEDIA_FILES = 5; // Define the limit
const ACCEPTED_MIME_TYPES = ['image/', 'video/']; // Define accepted MIME type prefixes

// Add onPostSuccess prop definition
interface CreatePostInputProps {
  onPostSuccess?: () => void;
}

const CreatePostInput: React.FC<CreatePostInputProps> = ({ onPostSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch(); 
  const theme = useTheme(); 
  const currentUser = useAppSelector(selectCurrentUser); 
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); // General post error
  const [isExpanded, setIsExpanded] = useState(false); 
  const inputRef = useRef<HTMLInputElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState<HTMLButtonElement | null>(null); 
  const [visibility, setVisibility] = useState<PostVisibility>('public'); // <-- Add state for visibility

  // --- Multiple Media Upload State ---
  const [mediaFiles, setMediaFiles] = useState<MediaFileState[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null); // General upload error (e.g., limit exceeded)

  // Cleanup preview URLs on unmount or when files are removed
  useEffect(() => {
    const urlsToRevoke = mediaFiles.map(mf => mf.previewUrl).filter(Boolean) as string[];
    return () => {
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  }, [mediaFiles]); // Rerun when mediaFiles array changes


  useEffect(() => {
    if (isExpanded && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50); 
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleFocus = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBlur = (_event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      const relatedTarget = document.activeElement;
      const emojiPopover = document.getElementById('emoji-picker-popover');
      const visibilityMenu = document.getElementById('visibility-select-menu'); // Get visibility menu

      if (
        containerRef.current &&
        !containerRef.current.contains(relatedTarget) &&
        (!emojiPopover || !emojiPopover.contains(relatedTarget)) &&
        (!visibilityMenu || !visibilityMenu.contains(relatedTarget)) && // Check visibility menu
        !postContent.trim() &&
        mediaFiles.length === 0 // Collapse only if no text and no media files
      ) {
        setIsExpanded(false);
        setShowEmojiPicker(false); 
      }
    }, 0);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const cursorPosition = inputRef.current?.selectionStart ?? postContent.length;
    const textBeforeCursor = postContent.substring(0, cursorPosition);
    const textAfterCursor = postContent.substring(cursorPosition);
    setPostContent(textBeforeCursor + emojiData.emoji + textAfterCursor);
    if (!isExpanded) setIsExpanded(true); // Expand if adding emoji to collapsed input
    inputRef.current?.focus(); 
    setTimeout(() => {
        inputRef.current?.setSelectionRange(cursorPosition + emojiData.emoji.length, cursorPosition + emojiData.emoji.length);
    }, 0);
  };

  const handleEmojiPickerToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isExpanded) setIsExpanded(true); // Expand if opening emoji picker
    setEmojiPickerAnchorEl(event.currentTarget);
    setShowEmojiPicker((prev) => !prev); 
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
    setShowEmojiPicker(false);
  };

  // --- Media Handling ---

   const handleUploadMedia = async (fileId: string, file: File) => {
    // Set status to uploading for this specific file
    setMediaFiles(prev => prev.map(mf => mf.id === fileId ? { ...mf, status: 'uploading', progress: 0, error: null } : mf));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/posts/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? file.size));
          // Update progress for the specific file
           setMediaFiles(prev => prev.map(mf => mf.id === fileId ? { ...mf, progress: percentCompleted } : mf));
        },
      });

      if (response.status === 201 && response.data.url) {
         // Update status and uploadedMedia for the specific file
         setMediaFiles(prev => prev.map(mf => mf.id === fileId ? { 
             ...mf, 
             status: 'uploaded', 
             uploadedMedia: { url: response.data.url, type: response.data.contentType }, 
             progress: 100 // Ensure progress shows 100%
            } : mf));
        console.log(`Media ${fileId} uploaded:`, response.data);
      } else {
        console.error(`Media ${fileId} upload failed with status:`, response.status, response.data);
         // Update status and error for the specific file
         setMediaFiles(prev => prev.map(mf => mf.id === fileId ? { 
             ...mf, 
             status: 'error', 
             error: t('social.uploadErrorGeneric', 'Media upload failed. Please try again.'),
             progress: 0 
            } : mf));
      }
    } catch (err: unknown) { 
      console.error(`Media ${fileId} upload error:`, err);
      let detailMessage: string | null = null;
      if (typeof err === 'object' && err !== null) {
         if ('response' in err && typeof err.response === 'object' && err.response !== null &&
             'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null &&
             'detail' in err.response.data && typeof err.response.data.detail === 'string') {
           detailMessage = err.response.data.detail;
         }
      }
       // Update status and error for the specific file
       setMediaFiles(prev => prev.map(mf => mf.id === fileId ? { 
           ...mf, 
           status: 'error', 
           error: detailMessage || t('social.uploadErrorGeneric', 'Media upload failed. Please try again.'),
           progress: 0 
          } : mf));
    } 
    // Note: No finally block needed here as isUploading is not used globally anymore
  };

   /**
   * Processes a list of files: checks limits, filters types, updates state, and triggers uploads.
   * @param filesToProcess The File objects to process.
   * @returns `true` if any valid files were added, `false` otherwise.
   */
   const processAndUploadFiles = (filesToProcess: File[]): boolean => {
    const currentFileCount = mediaFiles.length;
    
    if (currentFileCount + filesToProcess.length > MAX_MEDIA_FILES) {
        setUploadError(t('social.uploadLimitError', `You can only upload up to ${MAX_MEDIA_FILES} files.`));
        return false; // Indicate no files were processed due to limit
    }

    setUploadError(null); // Clear any previous limit error

    const newMediaFileStates: MediaFileState[] = [];
    let validFilesFound = false;

    filesToProcess.forEach((file, index) => {
        // Check if the file type starts with any of the accepted prefixes
        const isValidType = ACCEPTED_MIME_TYPES.some(prefix => file.type.startsWith(prefix));
        
        if (!isValidType) {
            console.warn(`Skipping invalid file type: ${file.name} (${file.type})`);
            // Optionally set a specific error message for invalid types if needed
            // setUploadError(prev => prev ? `${prev}\nSkipped ${file.name}` : `Skipped ${file.name}: Invalid type`);
            return; // Skip this file
        }

        validFilesFound = true;
        const fileId = `${Date.now()}-${index}`; // Simple unique ID
        const previewUrl = URL.createObjectURL(file);
        
        newMediaFileStates.push({
            id: fileId,
            file: file,
            previewUrl: previewUrl,
            status: 'idle',
            progress: 0,
            uploadedMedia: null,
            error: null,
        });
    });

    if (newMediaFileStates.length > 0) {
        // Add new valid files to state and trigger uploads
        setMediaFiles(prev => [...prev, ...newMediaFileStates]);
        newMediaFileStates.forEach(mf => handleUploadMedia(mf.id, mf.file));
        if (!isExpanded) {
            setIsExpanded(true); // Ensure component expands if files were added
        }
        return true; // Indicate files were processed
    } else if (validFilesFound) {
         // This case might happen if all valid files failed some other check (unlikely here)
         return false;
    } else {
        // No valid files found among the processed ones
        if (filesToProcess.length > 0) {
             // Show a generic error if files were provided but none were valid
             setUploadError(t('social.uploadInvalidTypeError', `No valid image or video files found.`));
        }
        return false;
    }
  };


  const handleMediaButtonClick = () => {
    setUploadError(null); // Clear previous general upload errors
    fileInputRef.current?.click(); 
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        processAndUploadFiles(Array.from(files));
    }
     // Reset file input value to allow selecting the same file(s) again
     if (event.target) {
        event.target.value = '';
     }
  };

   // --- Paste Handling ---
  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const filesToProcess: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          // Check type immediately before adding to list
          const isValidType = ACCEPTED_MIME_TYPES.some(prefix => file.type.startsWith(prefix));
          if (isValidType) {
             filesToProcess.push(file);
          } else {
             console.warn(`Skipping pasted file with invalid type: ${file.name} (${file.type})`);
             // Optionally accumulate these errors to show the user
          }
        }
      }
    }

    if (filesToProcess.length > 0) {
       // Prevent default paste behavior (e.g., pasting file path as text) ONLY if we are handling files.
       event.preventDefault(); 
       const filesProcessed = processAndUploadFiles(filesToProcess);
       if (!filesProcessed && filesToProcess.length > 0) {
            // Handle case where processing failed (e.g., limit exceeded) but files were present
            // The error state should already be set by processAndUploadFiles
       } else if (!filesProcessed) {
            // Handle case where no *valid* files were found in the paste
             setUploadError(t('social.uploadInvalidTypeError', `No valid image or video files found in pasted content.`));
       } else {
         // Files were successfully processed, ensure focus if needed
         setTimeout(() => inputRef.current?.focus(), 0); 
       }
    } 
    // If no files were found in clipboard items, allow default paste behavior (for text, etc.)
  };
  // --- End Paste Handling ---


  const handleRemoveMedia = (fileIdToRemove: string) => {
      setMediaFiles(prev => {
          const fileToRemove = prev.find(mf => mf.id === fileIdToRemove);
          if (fileToRemove?.previewUrl) {
              URL.revokeObjectURL(fileToRemove.previewUrl); // Revoke URL before removing
          }
          return prev.filter(mf => mf.id !== fileIdToRemove);
      });
      // Clear general upload error if it was the limit error and now we are below limit
      if (uploadError?.includes(MAX_MEDIA_FILES.toString()) && mediaFiles.length -1 < MAX_MEDIA_FILES) {
          setUploadError(null);
      }
  }
  // --- End Media Handling ---


  const handlePostSubmit = async () => {
    const successfullyUploadedMedia = mediaFiles.filter(mf => mf.status === 'uploaded' && mf.uploadedMedia);
    const isAnyMediaUploading = mediaFiles.some(mf => mf.status === 'uploading');
    const hasPendingOrFailedUploads = mediaFiles.some(mf => mf.status === 'idle' || mf.status === 'error');

    // Allow posting only text OR text with at least one successfully uploaded media
    if (!postContent.trim() && successfullyUploadedMedia.length === 0) {
      return; 
    }
    if (isAnyMediaUploading) {
        setError(t('social.postErrorMediaUploading', 'Please wait for media uploads to complete.'));
        return;
    }
     if (hasPendingOrFailedUploads && successfullyUploadedMedia.length === 0) {
        // If there are pending/failed uploads but NO successful ones, prevent post
        setError(t('social.postErrorMediaNotUploaded', 'Some media failed to upload. Please remove them before posting.'));
        return;
    }
    // Allow posting even with failed uploads if at least one succeeded? User decision. Let's allow it for now.
    
    if (!currentUser) {
        setError(t('social.postErrorNotLoggedIn', 'You must be logged in to post.'));
        return;
    }

    setIsSubmitting(true);
    setError(null); 
    setUploadError(null); 
    setShowEmojiPicker(false); 
    setEmojiPickerAnchorEl(null);

    // Prepare media data for submission (only successfully uploaded ones)
    const mediaPayload = successfullyUploadedMedia.map(mf => ({ 
        url: mf.uploadedMedia!.url, 
        type: mf.uploadedMedia!.type 
    }));

    try {
      const response = await apiClient.post('/posts', { 
        content: postContent.trim(), 
        mediaUrls: mediaPayload,
        visibility: visibility, // <-- Use visibility state here
      });

      if (response.status === 201) {
        // Reset state fully on success
        setPostContent(''); 
        setMediaFiles([]); // Clear all media states (URLs revoked by useEffect)
        setIsExpanded(false); 
        dispatch(requestFeedRefresh()); 
        console.log('Post created, requesting feed refresh:', response.data);
        // Call the success callback if provided
        if (onPostSuccess) {
          onPostSuccess();
        }
      } else {
         console.error('Unexpected response status:', response.status);
         setError(t('social.postErrorUnexpected', 'An unexpected error occurred while posting.'));
      }
    } catch (err: unknown) {
      console.error('Failed to create post:', err);
      let errorMessage = t('social.postErrorGeneric', 'Failed to create post. Please try again.');
      if (typeof err === 'object' && err !== null) {
        if ('response' in err && typeof err.response === 'object' && err.response !== null &&
            'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null &&
            'detail' in err.response.data && typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } 
        else if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if post button should be disabled
  const isAnyMediaUploadingCheck = mediaFiles.some(mf => mf.status === 'uploading');
  const hasSuccessfullyUploadedMediaCheck = mediaFiles.some(mf => mf.status === 'uploaded');
  const hasPendingOrFailedUploadsCheck = mediaFiles.some(mf => mf.status === 'idle' || mf.status === 'error');

  // Disable post if: submitting, any media is uploading, OR (no text AND no successfully uploaded media)
  // Also disable if there are pending/failed uploads AND no successful uploads yet.
  const isPostDisabled = isSubmitting || isAnyMediaUploadingCheck || 
                         (!postContent.trim() && !hasSuccessfullyUploadedMediaCheck) ||
                         (hasPendingOrFailedUploadsCheck && !hasSuccessfullyUploadedMediaCheck && mediaFiles.length > 0);


  return (
    <Box sx={{ mb: 3 }}> 
      <Paper 
        ref={containerRef} 
        onPaste={handlePaste} // Add the paste handler here
        sx={theme => ({ 
          p: isExpanded ? 2 : '4px 8px', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: '12px', 
          border: `1px solid ${theme.palette.divider}`, 
          boxShadow: theme.palette.mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.2)',
          backgroundColor: theme.palette.background.paper,
          transition: theme.transitions.create(['padding'], { 
            duration: theme.transitions.duration.short,
          }),
          // Add focus styles if needed, though focus usually goes to the input
          // '&:focus-within': { borderColor: theme.palette.primary.main } 
        })}
        // Making the Paper itself focusable *might* be needed in some edge cases,
        // but usually the TextField handles focus naturally. Add if paste doesn't work reliably.
        // tabIndex={-1} 
      >
        {/* Hidden File Input */}
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={ACCEPTED_MIME_TYPES.map(prefix => `${prefix}*`).join(',')} // Use defined types
            multiple // Allow multiple files
            style={{ display: 'none' }}
        />
        {/* Wrap content in an actual form */}
        <form onSubmit={(e) => { e.preventDefault(); handlePostSubmit(); }} style={{ display: 'contents' }}>
        {/* Top Row: Avatar and Text Input */}
        <Box sx={{ display: 'flex', alignItems: isExpanded ? 'flex-start' : 'center', width: '100%', gap: 1.5 }}> 
          <Avatar src={currentUser?.profilePicture || undefined} sx={{ mt: isExpanded ? 1 : 0, ml: isExpanded ? 0 : 0.5 }} /> 
          <TextField
            inputRef={inputRef} 
            fullWidth
            multiline={isExpanded} 
            minRows={isExpanded ? 3 : 1} 
            maxRows={isExpanded ? 10 : 1} 
            variant="standard" 
            placeholder={t('social.postPlaceholder', "What's on your mind?")}
            value={postContent}
            onChange={(e) => {
              setPostContent(e.target.value);
              if (error) setError(null); 
            }}
            onFocus={handleFocus} 
            onBlur={handleBlur} 
            disabled={isSubmitting || isAnyMediaUploadingCheck} // Disable input during any upload
            InputProps={{
              disableUnderline: true, 
              sx: { 
                fontSize: isExpanded ? '1rem' : '0.95rem', 
                padding: isExpanded ? '8px 0' : '6px 0', 
                lineHeight: isExpanded ? 1.6 : 1.4 
               } 
            }}
            sx={{ 
              flexGrow: 1, 
              alignSelf: isExpanded ? 'stretch' : 'center', 
            }}
          />
           {!isExpanded && (
             <Button 
               variant="contained" 
               onClick={handleFocus} // Clicking this effectively expands and focuses input
               size="medium" 
               sx={{ 
                 borderRadius: '20px', 
                 px: 3, 
                 mr: 0.5,
                 textTransform: 'none' 
               }} 
               // Disable if any media is already attached (user should interact with expanded view)
               disabled={mediaFiles.length > 0} 
             >
               {t('social.postButton', 'Post')}
             </Button>
           )}
        </Box>

         {/* Media Preview Area (only when expanded and files exist) */}
         {isExpanded && mediaFiles.length > 0 && (
            <Box sx={{ mt: 1.5, ml: 'calc(40px + 12px)' }}> {/* Align with text input */}
                 {/* General Upload Error (like limit exceeded or invalid type) */}
                 {uploadError && (
                    <Alert severity="warning" sx={{ mb: 1 }}>{uploadError}</Alert> // Changed severity to warning
                 )}
                 {/* Grid for Previews */}
                 <Grid container spacing={1}>
                    {mediaFiles.map((mf) => (
                        <Grid item key={mf.id} xs={6} sm={4} md={3}> {/* Adjust grid sizing as needed */}
                            <Box sx={{ position: 'relative', width: '100%', paddingBottom: '100%', /* 1:1 Aspect Ratio */ height: 0, overflow: 'hidden', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.palette.action.hover }}>
                                    {mf.previewUrl && mf.file.type.startsWith('image/') ? (
                                        <img src={mf.previewUrl} alt={t('social.mediaPreviewAlt', 'Media preview')} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : mf.previewUrl && mf.file.type.startsWith('video/') ? (
                                        <video src={mf.previewUrl} controls={mf.status === 'uploaded'} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}>
                                            {t('post.videoUnsupported', 'Your browser does not support the video tag.')}
                                        </video>
                                    ) : 
                                    // Fallback for potentially broken previews (shouldn't happen often)
                                    <Typography variant="caption" color="textSecondary">Preview unavailable</Typography>
                                    }
                                </Box>
                                {/* Progress/Status Overlay */}
                                {(mf.status === 'uploading' || mf.status === 'error') && (
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                                        {mf.status === 'uploading' && (
                                            <Box sx={{ width: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <LinearProgress variant="determinate" value={mf.progress} sx={{ width: '100%', mb: 0.5 }} color="inherit"/>
                                                <Typography variant="caption" sx={{ color: 'white' }}>{`${mf.progress}%`}</Typography>
                                            </Box>
                                        )}
                                         {mf.status === 'error' && (
                                            <Typography variant="caption" color="error" textAlign="center" sx={{ color: '#ffcdd2', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}> {/* Lighter error text, limit lines */}
                                                {mf.error || t('social.uploadErrorGeneric', 'Upload failed')}
                                            </Typography>
                                         )}
                                    </Box>
                                )}
                                {/* Remove Button Overlay */}
                                <IconButton
                                    aria-label={t('social.removeMedia', 'Remove media')}
                                    onClick={() => handleRemoveMedia(mf.id)}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        }
                                    }}
                                >
                                    <X size={16} /> {/* Use X icon */}
                                </IconButton>
                            </Box>
                        </Grid>
                    ))}
                 </Grid>
            </Box>
         )}


        {/* Conditionally Render Divider and Bottom Row */}
        {isExpanded && (
          <>
            <Divider sx={{ my: 1.5 }} /> 
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {/* Action Icons & Visibility Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}> {/* Wrap icons and selector */}
                {/* Image Upload Button */}
                 <IconButton 
                  aria-label={t('social.addMedia', 'Add image or video')} 
                  color="primary" 
                  onClick={handleMediaButtonClick}
                  disabled={isSubmitting || mediaFiles.some(mf => mf.status === 'uploading') || mediaFiles.length >= MAX_MEDIA_FILES} // Disable if uploading or limit reached
                  size="small" 
                  title={mediaFiles.length >= MAX_MEDIA_FILES ? t('social.uploadLimitReachedTooltip', `Maximum ${MAX_MEDIA_FILES} files reached`) : undefined} // Add tooltip for disabled state
                >
                  <ImageIcon size={20} /> 
                </IconButton>
                {/* Emoji Button */}
                <IconButton 
                  aria-label={t('social.addEmoji', 'Add emoji')} 
                  color="primary" 
                  onClick={handleEmojiPickerToggle} 
                  disabled={isSubmitting || isAnyMediaUploadingCheck}
                  size="small" 
                >
                  <Smiley size={20} /> 
                </IconButton>
                 {/* Add other icons here */}

                 {/* Visibility Selector - Styled Select */}
                  {/* <FormControl variant="standard" sx={{ minWidth: 120, ml: 1 }} size="small"> */}
                    {/* InputLabel might be redundant with the icon+text in Select */}
                    {/* <InputLabel id="visibility-select-label">Visibility</InputLabel> */}
                    <Select
                        labelId="visibility-select-label" // Keep for accessibility, even without visual label
                        id="visibility-select"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                        variant="standard" // Use standard variant to easily remove underline
                        disableUnderline
                        MenuProps={{ id: 'visibility-select-menu' }} // Keep ID for blur logic
                        sx={{
                            ml: 1, // Add some margin to the left
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                padding: '6px 8px', // Consistent padding
                                borderRadius: '4px', // Slight rounding
                                transition: 'background-color 0.2s ease',
                                '.MuiSvgIcon-root': { // Style the dropdown arrow within the select display
                                     marginLeft: '4px', // Space before arrow
                                     fontSize: '1.1rem',
                                     color: 'text.secondary',
                                 },
                                 // Apply hover effect normally
                                 '&:hover': { 
                                     backgroundColor: theme.palette.action.hover, 
                                 },
                                 // Ensure focused state (menu open) removes the hover background
                                 '&.Mui-focused': {
                                     backgroundColor: 'transparent', 
                                 },
                             },
                             // Remove focus outline from the root Select element if needed
                             // '&:focus': {
                             //    backgroundColor: 'transparent', 
                             // },
                             // Ensure Menu items still look okay
                             '& .MuiMenuItem-root': {
                                 fontSize: '0.875rem',
                             },
                        }}
                        // No label prop needed if we don't use InputLabel
                    >
                        <MenuItem value="public">
                            <GlobeHemisphereWest size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                            {t('social.visibility.public', 'Public')}
                        </MenuItem>
                        <MenuItem value="connections">
                             <Users size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                            {t('social.visibility.connections', 'Connections')}
                        </MenuItem>
                        <MenuItem value="private">
                            <Lock size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                            {t('social.visibility.private', 'Private')}
                        </MenuItem>
                    </Select>
                {/* </FormControl> */}

              </Box>

              {/* Submit Button */}
              <Button 
                type="submit" // Changed from onClick to type="submit" for form semantics
                variant="contained" 
                // onClick removed, form onSubmit handles it
                disabled={isPostDisabled} 
                size="medium" 
                sx={{ 
                  borderRadius: '20px', 
                  px: 3, 
                  textTransform: 'none' 
                }} 
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('social.postButton', 'Post')}
              </Button>
            </Box>
          </>
        )}
        </form>
      </Paper>
      {/* Emoji Picker Popover */}
      <Popover
        id="emoji-picker-popover" 
        open={showEmojiPicker}
        anchorEl={emojiPickerAnchorEl}
        onClose={handleEmojiPickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <EmojiPicker 
          onEmojiClick={handleEmojiClick} 
          autoFocusSearch={false}
          theme={theme.palette.mode === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
          lazyLoadEmojis={true}
        />
      </Popover>
      {/* Display general post error */}
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>
      )}
    </Box>
  );
};

export default CreatePostInput;