import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux'; // Import useSelector
import { useNavigate } from 'react-router-dom'; // Added
import { useChatContext } from 'stream-chat-react'; // Added
import {
  Box, 
  Autocomplete, // Import Autocomplete
  TextField, 
  Snackbar, 
  Alert as MuiAlert, 
  CircularProgress, 
  Chip, 
  Avatar, 
  Stack, 
  Divider,
  Paper,
  IconButton,
  Collapse,
  Link,
  Button,
  Tooltip,
  Typography,
  Grid,
  InputAdornment,
  ListItem, // Import ListItem
  ListItemAvatar, // Import ListItemAvatar
  ListItemText // Import ListItemText
} from '@mui/material';
import { 
  MapPin, 
  PaperPlaneTilt, // Import PaperPlaneTilt for invite button
  Calendar, 
  User,
  Users,
  TextT,
  CaretDown,
  CaretUp,
  ArrowSquareOut,
  Warning,
  CalendarPlus,
  Download,
  ArrowRight,
  ChatCircleDots // Added
} from '@phosphor-icons/react';
import axios from 'axios'; // Import axios
import { AccessibleTypography } from '../../../app/components/AccessibleTypography'; 
// Use correct package name and import fetch function
import { Commitment, fetchCommitmentById, fetchUserByUsername, User as UserType, selectCurrentUser, fetchUsers } from '@neurolink/shared'; // Import selectCurrentUser and fetchUsers
// Import the configured apiClient
import apiClient from '../../../app/api/apiClient';
// Import AlertProps for Snackbar Alert
import { AlertProps } from '@mui/material/Alert';
// import { useGetCommitmentByIdQuery } from '@/shared/features/commitments/commitmentsAPI'; // Placeholder
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import debounce from 'lodash/debounce'; // Import debounce
import { toast } from 'react-toastify'; // Added for error feedback


// Define props interface
interface CommitmentDetailProps {
  commitmentId: number | string; // Accept number or string
}

// Placeholder hook updated to use apiClient and fetchCommitmentById
const useGetCommitmentByIdQuery = (id: number | string | undefined) => { // Accept number or string
  const [data, setData] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        setError(new Error("Commitment ID is missing"));
        return;
    }

    // Define the async function to fetch data using apiClient
    const loadCommitment = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the imported apiClient and fetchCommitmentById function
        const result = await fetchCommitmentById(apiClient, id);
        setData(result);
      } catch (e) {
        if (e instanceof Error) {
          setError(e);
        } else {
          console.error("Caught a non-Error object:", e);
          setError(new Error('An unknown error occurred while fetching commitment details.'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCommitment(); // Call the async function

  }, [id]); // Dependency array includes the id

  return { data, isLoading, error };
};


// Update component definition to accept props
const CommitmentDetail: React.FC<CommitmentDetailProps> = ({ commitmentId }) => {
  const { t } = useTranslation();
  const id = commitmentId;
  const { data: commitment, isLoading, error } = useGetCommitmentByIdQuery(id);
  const { client: chatClient } = useChatContext(); // Added: Get chat client
  const navigate = useNavigate(); // Added: Get navigate function
  const currentUser = useSelector(selectCurrentUser); // Get current user
  const [mapExpanded, setMapExpanded] = useState(true);
  const [participantDetails, setParticipantDetails] = useState<UserType[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [creatorDetails, setCreatorDetails] = useState<UserType | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false); // Added: State for chat button loading
  
  // State for invite functionality (Autocomplete)
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<UserType | null>(null); // Store selected user object
  const [inviteInputValue, setInviteInputValue] = useState(''); // Input value for autocomplete
  const [userOptions, setUserOptions] = useState<UserType[]>([]); // Options for autocomplete
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for user fetch
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Check if the current user is the creator
  const isCreator = currentUser?.username === commitment?.creatorUsername;

  useEffect(() => {
    const fetchCreatorDetails = async () => {
      if (!commitment?.creatorUsername) return;

      setLoadingCreator(true);
      setCreatorError(null);
      try {
        const creator = await fetchUserByUsername(apiClient, commitment.creatorUsername);
        setCreatorDetails(creator);
      } catch (err) {
        console.error(`Failed to load details for creator ${commitment.creatorUsername}:`, err);
        setCreatorError(t('commitments.detail.creatorLoadError', 'Failed to load creator details.'));
      } finally {
        setLoadingCreator(false);
      }
    };

    const fetchParticipantDetails = async () => {
      if (!commitment?.participants?.length) return;
      
      setLoadingParticipants(true);
      setParticipantError(null);
      
      try {
        const userPromises = commitment.participants.map(participant => 
          fetchUserByUsername(apiClient, participant.username)
        );
        
        const results = await Promise.allSettled(userPromises);
        const userDetails: UserType[] = [];
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            userDetails.push(result.value);
          } else {
            console.error(`Failed to load details for ${commitment.participants[index].username}:`, result.reason);
          }
        });
        
        setParticipantDetails(userDetails);
      } catch (err) {
        console.error('Error loading participant details:', err);
        setParticipantError(t('commitments.detail.participantsLoadError', 'Failed to load participant details.'));
      } finally {
        setLoadingParticipants(false);
      }
    };
    
    if (commitment) {
      fetchCreatorDetails();
      fetchParticipantDetails();
    }
  }, [commitment, t]); 

  // Debounced function to fetch users for autocomplete
  const debouncedFetchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) { // Only search if query is long enough
        setUserOptions([]);
        setLoadingUsers(false);
        return;
      }
      setLoadingUsers(true);
      try {
        const response = await fetchUsers(apiClient, { q: query, limit: 5 }); // Fetch top 5 matches
        // Filter out the current user and already participating users
        const existingUsernames = new Set([
          currentUser?.username, 
          ...(commitment?.participants?.map(p => p.username) || [])
        ]);
        // Use response.users and explicitly type 'user' in filter
        setUserOptions(response.users.filter((user: UserType) => !existingUsernames.has(user.username))); 
      } catch (fetchError) {
        console.error("Failed to fetch users for autocomplete:", fetchError);
        setUserOptions([]); // Clear options on error
      } finally {
        setLoadingUsers(false);
      }
    }, 300), // Debounce for 300ms
    [apiClient, currentUser?.username, commitment?.participants] // Dependencies
  );

  useEffect(() => {
    // Trigger fetch when input value changes
    debouncedFetchUsers(inviteInputValue);
  }, [inviteInputValue, debouncedFetchUsers]);


  const handleInvite = async () => {
    // Use the username from the selected user object
    if (!selectedUserToInvite?.username || !commitment?.id) return; 
    const usernameToInvite = selectedUserToInvite.username;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      // Use apiClient directly for the POST request
      const response = await apiClient.post(`/commitment/invitations/${commitment.id}`, {
        invitedUsername: usernameToInvite, // Send the selected username
      });

      // Assuming a successful response means the invitation was created
      if (response.status === 200) {
        // Use the display name or username in the success message
        const invitedName = selectedUserToInvite.displayName || usernameToInvite;
        setInviteSuccess(t('commitments.detail.inviteSuccess', { username: invitedName }));
        setSelectedUserToInvite(null); // Clear selected user
        setInviteInputValue(''); // Clear input value
        setUserOptions([]); // Clear options
        setSnackbarOpen(true);
        // TODO: Optionally, refetch participants or update the list locally if the API returns the new participant
      } else {
        // Handle non-200 success responses if necessary
        setInviteError(t('commitments.detail.inviteErrorUnexpected', 'Received an unexpected response from the server.'));
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Failed to send invitation:', err);
      let apiErrorMessage = 'An unknown error occurred.';
      // Check if it's an Axios error with a response
      if (axios.isAxiosError(err)) { // Use axios.isAxiosError
        if (err.response?.data) {
          // Use the error message from the API response if available
          apiErrorMessage = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
        } else {
          // Use the general Axios error message if no specific data is available
          apiErrorMessage = err.message;
        }
      } else if (err instanceof Error) {
        // Handle non-Axios errors
        apiErrorMessage = err.message; 
      }
      
      setInviteError(t('commitments.detail.inviteError', `Failed to invite user: ${apiErrorMessage}`));
      setSnackbarOpen(true);
    } finally {
      setIsInviting(false);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
    // Reset messages after snackbar closes
    setTimeout(() => {
        setInviteError(null);
        setInviteSuccess(null);
    }, 300); // Delay to allow fade out
  };

  // Custom Alert component for Snackbar
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });


  if (isLoading || loadingCreator) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {t('commitments.detail.errorLoading', 'Failed to load commitment details.')} {error.message}
      </Alert>
    );
  }

  if (!commitment) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {t('commitments.detail.notFound', 'Commitment not found.')}
      </Alert>
    );
  }

  const formattedDate = new Date(commitment.dateTime).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const toggleMap = () => {
    setMapExpanded(!mapExpanded);
  };

  // Generate a specific Google Maps URL for University of Auckland
  const getGoogleMapUrl = (location: string) => {
    // Always use the provided location description
    const query = encodeURIComponent(location);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`;
  };

  const isUniversityLocation = (location: string): boolean => {
    const lowerCaseLocation = location.toLowerCase();
    return lowerCaseLocation.includes('auckland') || 
           lowerCaseLocation.includes('university') || 
           lowerCaseLocation.includes('campus');
  };

  // Function to generate iCalendar file content
  const generateICalendarContent = () => {
    const startTime = new Date(commitment.dateTime);
    // Default duration is 1 hour if not specified
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    
    // Format dates as required for iCalendar format
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const startDateFormatted = formatDate(startTime);
    const endDateFormatted = formatDate(endTime);
    
    // Build iCalendar content
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Neurolink//Commitments//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${commitment.id}@neurolink.app`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${startDateFormatted}`,
      `DTEND:${endDateFormatted}`,
      `SUMMARY:${commitment.title}`,
      `DESCRIPTION:${commitment.description.replace(/\n/g, '\\n')}`,
      commitment.location?.description ? `LOCATION:${commitment.location.description}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
  };

  // Function to download the calendar event
  const downloadCalendarEvent = () => {
    const icsContent = generateICalendarContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${commitment.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Start Group Chat Handler (Copied from Preview) ---
  const handleStartChat = async () => {
    if (!chatClient || !currentUser?.username || !commitment?.participants) {
      console.error("Chat client, current user, or participants not available.");
      toast.error(t('chat.error.initiateFailed', 'Failed to initiate chat.'));
      return;
    }

    setIsStartingChat(true);
    try {
      // Ensure current user is included, remove duplicates just in case
      const participantUsernames = commitment.participants.map(p => p.username);
      const memberIds = Array.from(new Set([currentUser.username, ...participantUsernames]));

      if (memberIds.length < 2) {
        toast.info("Cannot start a group chat with only yourself."); // Or handle 1-1 chat differently
        setIsStartingChat(false);
        return;
      }

      console.log(`Creating/getting channel for members: ${memberIds.join(', ')}`);

      // Create a unique channel ID based on members if needed, or let Stream handle it
      // const channelId = memberIds.sort().join('-'); // Example deterministic ID

      const channel = chatClient.channel('messaging', {
        members: memberIds,
        name: `Commitment: ${commitment.title}` // Optional: Set a channel name based on commitment
        // created_by_id: currentUser.username // Optional: Track creator if needed
      });

      // Watch the channel to ensure it's initialized and ready
      await channel.watch();
      console.log(`Channel ${channel.id} watched successfully.`);

      // Navigate to the chat page, passing the channel ID
      navigate('/chat', { state: { channelId: channel.id } });

    } catch (err) {
      console.error("Failed to start group chat:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`${t('chat.error.initiateFailed', 'Failed to initiate chat.')}: ${errorMessage}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Title section */}
      <Box 
        sx={{ 
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <AccessibleTypography 
          variant="h4" 
          component="h2"
          sx={{ 
            fontWeight: 600,
            fontSize: '1.75rem'
          }}
        >
          {commitment.title}
        </AccessibleTypography>
        
        <Tooltip title={t('commitments.detail.addToCalendar', 'Add to your calendar')}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarPlus weight="regular" />}
            onClick={downloadCalendarEvent}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            {t('commitments.detail.addToCalendar', 'Add to calendar')}
          </Button>
        </Tooltip>
      </Box>

      {/* Main content container - single light shade containing everything */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          backgroundColor: theme => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24'
        }}
      >
        {/* Date and Location */}
        <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
          {/* Date */}
          <Box display="flex" alignItems="center">
            <Calendar size={22} weight="regular" style={{ marginRight: 12 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessibleTypography variant="body1" sx={{ color: 'text.primary' }}>
                {formattedDate}
              </AccessibleTypography>
              <IconButton
                size="small"
                onClick={downloadCalendarEvent}
                sx={{ ml: 1 }}
                aria-label={t('commitments.detail.addToCalendar', 'Add to your calendar')}
                title={t('commitments.detail.addToCalendar', 'Add to your calendar')}
              >
                <Download size={16} />
              </IconButton>
            </Box>
          </Box>

          {/* Location */}
          {commitment.location?.description && (
            <Box>
              <Box display="flex" alignItems="center">
                <MapPin size={22} weight="regular" style={{ marginRight: 12 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <AccessibleTypography variant="body1" sx={{ color: 'text.primary' }}>
                    {commitment.location.description}
                  </AccessibleTypography>
                  
                  <Box sx={{ display: 'flex', ml: 1 }}>
                    <IconButton 
                      onClick={toggleMap} 
                      size="small"
                      aria-label={mapExpanded ? "Hide map" : "Show map"}
                      title={mapExpanded ? "Hide map" : "Show map"}
                    >
                      {mapExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    </IconButton>
                    
                    <IconButton
                      component="a"
                      href="https://maps.auckland.ac.nz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      aria-label="Open University of Auckland map in a new tab"
                      title="Open University of Auckland map in a new tab"
                    >
                      <ArrowSquareOut size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              
              <Collapse in={mapExpanded}>
                <Box 
                  sx={{ 
                    mt: 2, 
                    ml: 0, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    border: theme => `1px solid ${theme.palette.divider}`
                  }}
                >
                  <iframe 
                    src={getGoogleMapUrl(commitment.location.description)}
                    title="Location Map"
                    width="100%" 
                    height="400px"
                    style={{ border: 'none' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    aria-label="Google Map showing location"
                  />
                  
                  <Box sx={{ p: 2, textAlign: 'center', borderTop: theme => `1px solid ${theme.palette.divider}` }}>
                    <Stack spacing={1.5}>
                      <AccessibleTypography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        Map results may not be 100% accurate. {isUniversityLocation(commitment.location.description) && 
                        "For University of Auckland locations, please use the official campus map."}
                      </AccessibleTypography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Warning size={16} style={{ color: '#f59e0b' }} />
                        <AccessibleTypography variant="body2" sx={{ color: 'text.secondary' }}>
                          For security reasons, we recommend meeting at campus locations instead of other places.
                        </AccessibleTypography>
                      </Box>
                      
                      <Link
                        href="https://maps.auckland.ac.nz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                          mt: 0.5
                        }}
                      >
                        <AccessibleTypography variant="body2">
                          {t('commitments.detail.viewCampusMap', 'View University of Auckland Campus Map')}
                        </AccessibleTypography>
                        <ArrowSquareOut size={14} />
                      </Link>
                    </Stack>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}
        </Stack>

        {/* Description label */}
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <TextT size={20} weight="regular" style={{ marginRight: 8 }} />
          <AccessibleTypography 
            variant="subtitle1" 
            component="h3" 
            sx={{ fontWeight: 600 }}
          >
            {t('commitments.detail.description', 'Description')}
          </AccessibleTypography>
        </Box>

        {/* Description with darker shade */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            backgroundColor: theme => theme.palette.mode === 'light' ? '#E5ECF6' : '#2a2a32'
          }}
        >
          <AccessibleTypography 
            variant="body1" 
            sx={{ 
              color: 'text.primary',
              lineHeight: 1.6 
            }}
          >
            {commitment.description}
          </AccessibleTypography>
        </Paper>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Creator and Participants section - single container */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: theme => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24'
        }}
      >
        {/* Creator section */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <User size={20} weight="regular" style={{ marginRight: 8 }} />
            <AccessibleTypography 
              variant="subtitle1" 
              component="h3" 
              sx={{ fontWeight: 600 }}
            >
              {t('commitments.detail.creator', 'Created By')}
            </AccessibleTypography>
          </Box>
          
          <Box sx={{ ml: 2 }}>
            {loadingCreator ? (
              <CircularProgress size={24} />
            ) : creatorError ? (
              <Alert severity="error" sx={{ maxWidth: 'fit-content' }}>
                {creatorError}
              </Alert>
            ) : creatorDetails ? (
              <Stack 
                direction="row" 
                spacing={1.5} 
                alignItems="center" 
                component={RouterLink} 
                to={`/people/${creatorDetails.username}`}
                sx={{ 
                  textDecoration: 'none', 
                  color: 'inherit', 
                  display: 'inline-flex'
                }}
              >
                <Avatar 
                  src={creatorDetails.profilePicture || undefined}
                  sx={{ width: 32, height: 32 }}
                >
                  {!creatorDetails.profilePicture && creatorDetails.username.charAt(0).toUpperCase()} 
                </Avatar>
                <Box>
                  <AccessibleTypography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 500,
                      lineHeight: 1.2
                    }}
                  >
                    {creatorDetails.displayName || creatorDetails.username}
                  </AccessibleTypography>
                   <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                      @{creatorDetails.username}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography variant="body1">{commitment.creatorUsername}</Typography> 
            )}
          </Box>
        </Box>

        {/* Participants section */}
        <Box>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Users size={20} weight="regular" style={{ marginRight: 8 }} />
            <AccessibleTypography 
              variant="subtitle1" 
              component="h3" 
              sx={{ fontWeight: 600 }}
            >
              {t('commitments.detail.participants', 'Participants')} ({commitment.participants.length})
            </AccessibleTypography>
          </Box>
          
          {loadingParticipants ? (
            <Box sx={{ ml: 2, py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : participantError ? (
            <Alert severity="error" sx={{ ml: 2 }}>
              {participantError}
            </Alert>
          ) : commitment.participants.length > 0 ? (
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
              {participantDetails.map((user) => {
                const MAX_TAGS_DISPLAYED = 3;
                
                const prioritizedTags = user.tags ? [
                  ...user.tags.filter(tag => ['skill', 'interest', 'programOfStudy'].includes(tag.type)),
                  ...user.tags.filter(tag => !['skill', 'interest', 'programOfStudy'].includes(tag.type))
                ].slice(0, MAX_TAGS_DISPLAYED) : [];
                
                return (
                  <Grid item xs={12} sm={12} md={6} key={user.id || user.username} sx={{ display: 'flex' }}>
                    <Paper
                      elevation={0}
                      sx={(theme) => ({ 
                        p: 2.5,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      })}
                    >
                      {/* User header with avatar and name */}
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1 }}>
                        <Avatar 
                          component={RouterLink}
                          to={`/people/${user.username}`}
                          src={user.profilePicture || undefined}
                          sx={{ width: 40, height: 40, cursor: 'pointer' }}
                        />
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                          <Link 
                            component={RouterLink} 
                            to={`/people/${user.username}`}
                            color="inherit"
                            underline="hover"
                            sx={{ display: 'block' }}
                          >
                            <AccessibleTypography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 500, 
                                fontSize: '0.875rem', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}
                            >
                              {user.displayName}
                            </AccessibleTypography>
                          </Link>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            @{user.username}
                          </Typography>
                        </Box>
                        
                        <Button
                          component={RouterLink}
                          to={`/people/${user.username}`}
                          size="small"
                          variant="text"
                          endIcon={<ArrowRight size={16} />}
                          sx={{ 
                            borderRadius: '20px', 
                            px: 1.5,
                            py: 0.3,
                            fontSize: '0.75rem',
                            alignSelf: 'flex-start',
                            flexShrink: 0,
                            minWidth: 'auto'
                          }}
                        >
                          {t('commitments.detail.viewProfile', 'View')}
                        </Button>
                      </Stack>
                      
                      {/* Tags Section */}
                      {prioritizedTags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: user.bio ? 1 : 0 }}>
                          {prioritizedTags.map((tag) => (
                            <Chip
                              key={`${tag.type}-${tag.value}`}
                              label={tag.value}
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      )}
                      
                      {/* Bio in card */}
                      {user.bio && (
                        <Paper 
                          elevation={0} 
                          sx={(theme) => ({ 
                            p: 1.2, 
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '8px',
                            mb: 1,
                            fontSize: '0.8rem'
                          })}
                        >
                          <Typography variant="body2" color="text.primary" sx={{ 
                            fontSize: '0.8rem', 
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {user.bio}
                          </Typography>
                        </Paper>
                      )}
                      
                      {/* View Full Profile button */}
                      <Button 
                        variant="text" 
                        fullWidth
                        component={RouterLink}
                        to={`/people/${user.username}`}
                        sx={(theme) => ({
                          borderRadius: '8px',
                          py: 0.6,
                          mt: 'auto',
                          bgcolor: alpha(theme.palette.primary.light, 0.1),
                          color: theme.palette.primary.main,
                          fontSize: '0.8rem',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.light, 0.2)
                          }
                        })}
                      >
                        {t('people.viewFullProfile', 'View Full Profile')}
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ ml: 2 }}>
              <AccessibleTypography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                {t('commitments.detail.noParticipants', 'No participants listed.')}
              </AccessibleTypography>
            </Box>
          )}

          {/* Start Group Chat Button */}
          {commitment.participants.length > 0 && chatClient && currentUser && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="medium" // Slightly larger for the main detail page
                startIcon={<ChatCircleDots size={18} />}
                onClick={handleStartChat}
                disabled={isStartingChat || loadingParticipants}
                sx={{ borderRadius: '20px', px: 3, py: 1 }} // Adjusted padding/radius
              >
                {isStartingChat ? t('common.loading', 'Loading...') : t('commitments.detail.startGroupChat', 'Start Group Chat')}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Invite User Section - Only visible to the creator */}
      {isCreator && (
        <>
          <Divider sx={{ my: 4 }} />
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: theme => theme.palette.mode === 'light' ? '#F0F4F8' : '#22272e' // Slightly different shade
            }}
          >
            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
              <Users size={20} weight="regular" style={{ marginRight: 8 }} />
              <AccessibleTypography 
                variant="subtitle1" 
                component="h3" 
                sx={{ fontWeight: 600 }}
              >
                {t('commitments.detail.inviteTitle', 'Invite Participants')}
              </AccessibleTypography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* Autocomplete Component */}
              <Autocomplete
                fullWidth
                freeSolo={false} // Don't allow arbitrary input, must select a user
                options={userOptions}
                loading={loadingUsers}
                value={selectedUserToInvite} // Controlled component value
                inputValue={inviteInputValue} // Controlled input value
                onInputChange={(event, newInputValue) => {
                  setInviteInputValue(newInputValue);
                }}
                onChange={(event, newValue: UserType | null) => {
                  setSelectedUserToInvite(newValue); // Update selected user object
                  setUserOptions([]); // Clear options after selection
                }}
                getOptionLabel={(option) => option.displayName || option.username} // How the option text is derived
                isOptionEqualToValue={(option, value) => option.username === value.username} // Ensure correct comparison
                // Customize how each option looks in the dropdown using ListItem components
                renderOption={(props, option) => (
                  <ListItem {...props} key={option.id} dense sx={{ paddingLeft: '8px', paddingRight: '8px' }}> {/* Add key and adjust padding */}
                    <ListItemAvatar sx={{ minWidth: 'auto', marginRight: 1.5 }}>
                      <Avatar 
                        src={option.profilePicture || undefined} 
                        sx={{ width: 32, height: 32 }} // Slightly larger avatar
                      >
                        {!option.profilePicture && option.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={option.displayName || option.username} 
                      secondary={`@${option.username}`} 
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
                // Customize text shown when no options match (only if input is long enough)
                noOptionsText={inviteInputValue.length < 2 ? t('commitments.detail.inviteKeepTyping', '') : t('commitments.detail.inviteNoUsersFound', 'No users found')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label={t('commitments.detail.inviteLabel', 'Search username to invite')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">@</InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleInvite}
                disabled={isInviting || !selectedUserToInvite} // Disable if no user is selected
                startIcon={isInviting ? <CircularProgress size={16} color="inherit" /> : <PaperPlaneTilt size={18} />}
                sx={{ textTransform: 'none', alignSelf: 'stretch' }} // Stretch button height to match Autocomplete
              >
                {/* Changed button text */}
                {isInviting ? t('commitments.detail.invitingButton', 'Inviting...') : t('commitments.detail.inviteButtonShort', 'Invite')}
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {/* Snackbar for feedback */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={inviteError ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {inviteError || inviteSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CommitmentDetail;
