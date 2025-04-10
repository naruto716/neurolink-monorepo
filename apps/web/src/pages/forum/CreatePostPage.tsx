/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  TextField,
  Button,
  Box,
  CircularProgress,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  alpha,
  Paper,
  Theme,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import SimpleMdeReact from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css'; // Import EasyMDE styles
import { Options } from 'easymde'; // Import Options type for SimpleMDE
import { Image } from '@phosphor-icons/react';

import { useAppDispatch, useAppSelector } from '../../app/store/initStore';
import {
  createPost,
  fetchForumTags, // Use renamed thunk
  selectForumTags,
  selectCreatePostStatus,
  PostCreateDTO,
  TagResponseDTO, // Re-add import
} from '@neurolink/shared';
import apiClient from '../../app/api/apiClient';
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import { toast } from 'react-toastify';

// Define interface for uploaded media
interface UploadedMedia {
  url: string;
  type: string;
}

// Define interface for media upload state
interface MediaUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const CreatePostPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Use any type to avoid conflicts with component ref types
  const editorRef = useRef<any>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Store tag names as strings
  const [mediaUpload, setMediaUpload] = useState<MediaUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const availableTags = useAppSelector(selectForumTags);
  const tagsStatus = useAppSelector(state => state.forum.tagsStatus);
  const createStatus = useAppSelector(selectCreatePostStatus);
  const createError = useAppSelector(state => state.forum.createPostError);

  // Fetch tags on component mount
  useEffect(() => {
    if (tagsStatus === 'idle') {
      dispatch(fetchForumTags({ apiClient })); // Use renamed thunk
    }
  }, [dispatch, tagsStatus]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  // Function to handle media upload button click
  const handleMediaButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Function to handle file selection
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // For now, we'll handle one file at a time
    
    // Check if file is image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error(t('forum.createPost.invalidFileType', 'Please upload an image or video file'));
      return;
    }

    // Reset input value to allow selecting the same file again
    event.target.value = '';
    
    // Prepare for upload
    setMediaUpload({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await apiClient.post('/posts/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? file.size));
          setMediaUpload(prev => ({
            ...prev,
            progress: percentCompleted,
          }));
        },
      });

      if (response.status === 201 && response.data.url) {
        // Upload successful
        const uploadedMedia: UploadedMedia = {
          url: response.data.url,
          type: response.data.contentType,
        };

        // Insert media into markdown editor
        insertMediaIntoEditor(uploadedMedia);
        
        // Reset upload state
        setMediaUpload({
          isUploading: false,
          progress: 0,
          error: null,
        });
        
        toast.success(t('forum.createPost.mediaUploadSuccess', 'Media uploaded successfully'));
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (err) {
      console.error('Media upload failed:', err);
      let errorMessage = t('forum.createPost.mediaUploadError', 'Failed to upload media');
      
      if (typeof err === 'object' && err !== null) {
        if ('response' in err && 
            typeof err.response === 'object' && 
            err.response !== null &&
            'data' in err.response && 
            typeof err.response.data === 'object' && 
            err.response.data !== null &&
            'detail' in err.response.data && 
            typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      }
      
      setMediaUpload({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });
      
      toast.error(errorMessage);
    }
  };

  // Function to insert media into the editor
  const insertMediaIntoEditor = (media: UploadedMedia) => {
    const isImage = media.type.startsWith('image/');
    const isVideo = media.type.startsWith('video/');
    
    let markdownToInsert = '';
    
    if (isImage) {
      markdownToInsert = `![image](${media.url})`;
    } else if (isVideo) {
      markdownToInsert = `<video controls width="100%" src="${media.url}"></video>`;
    } else {
      markdownToInsert = `[attachment](${media.url})`;
    }
    
    // Get the editor instance using any type to avoid type issues
    const editor = editorRef.current?.simpleMde?.codemirror;
    
    if (editor) {
      // Get cursor position
      const cursor = editor.getCursor();
      // Insert markdown at cursor position
      editor.replaceRange(markdownToInsert, cursor);
      // Focus the editor
      editor.focus();
    } else {
      // Fallback: append to the end of content
      setContent(prev => prev + (prev.length > 0 ? '\n\n' : '') + markdownToInsert);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error(t('forum.createPost.errorEmptyFields'));
      return;
    }

    // Don't allow submission while media is uploading
    if (mediaUpload.isUploading) {
      toast.error(t('forum.createPost.mediaUploadInProgress', 'Please wait for media upload to complete'));
      return;
    }

    const postData: PostCreateDTO = {
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags, // Already an array of strings
    };

    dispatch(createPost({ apiClient, postData }))
      .unwrap()
      .then(() => {
        toast.success(t('forum.createPost.successMessage'));
        navigate('/forum');
      })
      .catch(() => {
        const errorMessage = createError || t('forum.createPost.errorMessage');
        toast.error(errorMessage);
      });
  };

  // Options for SimpleMDE (fixed typing issue)
  const simpleMdeOptions = useMemo((): Options => ({
    autofocus: true,
    spellChecker: false,
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link', 'image', '|',
      'guide',
    ] as Options['toolbar'], // Proper type for toolbar
    status: false,
  }), []);

  // Custom styles for SimpleMDE
  const customEditorStyles = useMemo(() => ({
    '.CodeMirror': {
      border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
      borderRadius: '8px',
      backgroundColor: (theme: Theme) => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24',
      color: (theme: Theme) => theme.palette.text.primary,
      // Add cursor color for dark mode
      '& .CodeMirror-cursor': {
        borderLeft: (theme: Theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.8)' : '1px solid #000',
      },
    },
    '.editor-toolbar': {
      border: 'none',
      opacity: '1',
      backgroundColor: 'transparent',
      '& button': {
        color: (theme: Theme) => theme.palette.text.secondary,
      },
      '& button:hover, & button.active': {
        color: (theme: Theme) => theme.palette.primary.main,
        backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
        borderRadius: '4px',
      },
    },
  }), []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Hidden file input for media upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />
      
      <Box sx={{ mb: 4 }}>
        <AccessibleTypography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700, 
            my: 3,
            color: (theme: Theme) => theme.palette.mode === 'light' ? '#1c1c1c' : '#ffffff',
          }}
        >
          {t('forum.createPost.title')}
        </AccessibleTypography>
      </Box>

      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label={t('forum.createPost.postTitleLabel')}
              name="title"
              autoComplete="off"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createStatus === 'loading' || mediaUpload.isUploading}
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme: Theme) => theme.palette.primary.main,
                    borderWidth: '1px',
                  },
                },
              }}
            />

            {/* Explicitly type Autocomplete for freeSolo with object options */}
            <Autocomplete<string | TagResponseDTO, true, false, true>
              multiple
              freeSolo // Allow free text input
              id="tags-standard"
              options={availableTags || []} // Options are still TagResponseDTO[]
              getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
              value={selectedTags} // State is string[]
              onChange={(event, newValue: (string | TagResponseDTO)[]) => {
                // Map the mixed array (strings and TagResponseDTO objects) to just strings
                const newTagNames = newValue.map(value => {
                  // If it's a string, trim it. If it's an object, get its name and trim it.
                  const name = typeof value === 'string' ? value : value.name;
                  return name.trim();
                }).filter(name => name.length > 0); // Filter out any empty strings resulting from trimming

                // Remove duplicates and update state
                setSelectedTags([...new Set(newTagNames)]);
              }}
              // Remove custom filterOptions - let freeSolo handle adding new strings
              loading={tagsStatus === 'loading'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label={t('forum.createPost.tagsLabel')}
                  placeholder={t('forum.createPost.tagsPlaceholder')}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {tagsStatus === 'loading' ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              // Correct renderTags signature - value is string[] matching the state
              // @ts-expect-error - TagResponseDTO vs string type mismatch is expected
              renderTags={(value: readonly string[], getTagProps) =>
                value.map((option: string, index: number) => (
                  <Chip
                    variant="filled"
                    color="primary"
                    label={option} // Label is the string itself
                    {...getTagProps({ index })}
                    key={option + index} // Use string + index as key
                    sx={{ m: 0.5, borderRadius: '8px' }}
                  />
                ))
              }
              // isOptionEqualToValue={(option, value) => option.id === value.id} // Remove this, conflicts with freeSolo
              disabled={createStatus === 'loading' || mediaUpload.isUploading}
              sx={{
                '& .MuiAutocomplete-tag': {
                  margin: '4px',
                }
              }}
            />

            <Paper 
              elevation={0} 
              sx={{ 
                mb: 4,
                borderRadius: '16px',
                backgroundColor: (theme: Theme) => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <AccessibleTypography 
                  variant="subtitle1" 
                  sx={{ fontWeight: 600 }}
                >
                  {t('forum.createPost.contentLabel')}
                </AccessibleTypography>

                {/* Media upload button */}
                <Tooltip title={t('forum.createPost.uploadMedia', 'Upload media')}>
                  <IconButton
                    onClick={handleMediaButtonClick}
                    disabled={mediaUpload.isUploading || createStatus === 'loading'}
                    size="small"
                    color="primary"
                    aria-label={t('forum.createPost.uploadMedia', 'Upload media')}
                  >
                    <Image size={20} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* Media upload progress */}
              {mediaUpload.isUploading && (
                <Box sx={{ 
                  width: '100%', 
                  height: 4, 
                  position: 'relative' 
                }}>
                  <CircularProgress
                    variant="determinate"
                    value={mediaUpload.progress}
                    size={24}
                    thickness={5}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                </Box>
              )}
              
              {/* Media upload error */}
              {mediaUpload.error && (
                <Alert 
                  severity="error" 
                  onClose={() => setMediaUpload(prev => ({ ...prev, error: null }))}
                  sx={{ m: 2, mb: 0 }}
                >
                  {mediaUpload.error}
                </Alert>
              )}
              
              <Box sx={{ 
                p: 0,
                position: 'relative',
                ...customEditorStyles
              }}>
                <SimpleMdeReact
                  ref={editorRef}
                  id="content"
                  value={content}
                  onChange={handleContentChange}
                  options={simpleMdeOptions}
                />
              </Box>
            </Paper>

            <Box 
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                mt: 2
              }}
            >
              <Button
                variant="text"
                onClick={() => navigate('/forum')}
                sx={{ minWidth: '120px' }}
                disabled={createStatus === 'loading' || mediaUpload.isUploading}
              >
                {t('common.cancel')}
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                sx={{ minWidth: '200px' }}
                disabled={createStatus === 'loading' || mediaUpload.isUploading}
              >
                {createStatus === 'loading' ? 
                  <CircularProgress size={24} color="inherit" /> : 
                  t('forum.createPost.submitButton')
                }
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreatePostPage;