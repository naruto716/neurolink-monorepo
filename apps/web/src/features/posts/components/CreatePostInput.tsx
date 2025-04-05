import React, { useState, useRef, useEffect } from 'react'; 
import { Avatar, Box, Button, Paper, TextField, CircularProgress, Alert, IconButton, Divider, Popover, useTheme } from '@mui/material'; // Added Popover, useTheme
import { useAppDispatch, useAppSelector } from '../../../app/store/initStore';
import { selectCurrentUser, requestFeedRefresh } from '@neurolink/shared'; 
import apiClient from '../../../app/api/apiClient';
import { useTranslation } from 'react-i18next';
import { Smiley } from '@phosphor-icons/react'; 
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react'; // Import EmojiPicker

const CreatePostInput: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch(); 
  const theme = useTheme(); // Get theme for picker styling
  const currentUser = useAppSelector(selectCurrentUser); 
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); 
  const inputRef = useRef<HTMLInputElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State for emoji picker visibility
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState<HTMLButtonElement | null>(null); // Anchor for Popover

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
      const relatedTarget = document.activeElement; // More reliable way to get the newly focused element
      // Check if focus moved outside the container AND outside the emoji picker popover
      const popover = document.getElementById('emoji-picker-popover'); 
      if (
        containerRef.current && 
        !containerRef.current.contains(relatedTarget) && 
        (!popover || !popover.contains(relatedTarget)) && // Check if focus is not in popover
        !postContent.trim()
      ) {
        setIsExpanded(false);
        setShowEmojiPicker(false); // Close picker if collapsing
      }
    }, 0);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const cursorPosition = inputRef.current?.selectionStart ?? postContent.length;
    const textBeforeCursor = postContent.substring(0, cursorPosition);
    const textAfterCursor = postContent.substring(cursorPosition);
    setPostContent(textBeforeCursor + emojiData.emoji + textAfterCursor);
    // Optionally close picker after selection, or keep it open
    // setShowEmojiPicker(false); 
    // setEmojiPickerAnchorEl(null);
    // Refocus input after inserting emoji
    inputRef.current?.focus(); 
    // Set cursor position after the inserted emoji
    setTimeout(() => {
        inputRef.current?.setSelectionRange(cursorPosition + emojiData.emoji.length, cursorPosition + emojiData.emoji.length);
    }, 0);
  };

  const handleEmojiPickerToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiPickerAnchorEl(event.currentTarget);
    setShowEmojiPicker((prev) => !prev); // Toggle picker
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
    setShowEmojiPicker(false);
  };


  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      return; 
    }
    if (!currentUser) {
        setError(t('social.postErrorNotLoggedIn', 'You must be logged in to post.'));
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setShowEmojiPicker(false); // Close picker on submit
    setEmojiPickerAnchorEl(null);

    try {
      const response = await apiClient.post('/v1/Posts', { 
        content: postContent,
        visibility: 'public', 
      });

      if (response.status === 201) {
        setPostContent(''); 
        setIsExpanded(false); 
        dispatch(requestFeedRefresh()); 
        console.log('Post created, requesting feed refresh:', response.data);
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

  return (
    <Box sx={{ mb: 3 }}> 
      <Paper 
        ref={containerRef} 
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
        })}
      >
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
            disabled={isSubmitting}
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
               onClick={handleFocus} 
               size="medium" 
               sx={{ 
                 borderRadius: '20px', 
                 px: 3, 
                 mr: 0.5,
                 textTransform: 'none' 
               }} 
             >
               {t('social.postButton', 'Post')}
             </Button>
           )}
        </Box>

        {/* Conditionally Render Divider and Bottom Row */}
        {isExpanded && (
          <>
            <Divider sx={{ my: 1.5 }} /> 
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {/* Action Icons */}
              <Box> 
                <IconButton 
                  aria-label={t('social.addEmoji', 'Add emoji')} 
                  color="primary" 
                  onClick={handleEmojiPickerToggle} // Open/toggle picker
                  disabled={isSubmitting}
                  size="small" 
                >
                  <Smiley size={20} /> 
                </IconButton>
                 {/* Add other icons here */}
              </Box>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="contained" 
                onClick={handlePostSubmit} 
                disabled={isSubmitting || !postContent.trim()}
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
        id="emoji-picker-popover" // Add id for blur check
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
          // Optional: Adjust width/height if needed
          // width={350} 
          // height={450}
        />
      </Popover>
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>} 
    </Box>
  );
};

export default CreatePostInput;