import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  CircularProgress, 
  Alert, 
  Chip, 
  Avatar, 
  Stack, 
  // Divider removed
  Paper,
  IconButton,
  Collapse,
  Link,
  Button,
  // Tooltip removed (unused)
  Typography,
  Grid
} from '@mui/material';
import { 
  MapPin, 
  Calendar, 
  User,
  Users,
  TextT,
  CaretDown,
  CaretUp,
  ArrowSquareOut,
  // Warning removed (unused)
  // CalendarPlus removed (top button)
  Download,
  ArrowRight
} from '@phosphor-icons/react';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography'; // Corrected import path
import { Commitment, fetchCommitmentById, fetchUserByUsername, User as UserType } from '@neurolink/shared';
import apiClient from '../../../app/api/apiClient';
import { Link as RouterLink } from 'react-router-dom';
// alpha removed (unused)

// Define props interface (same as Detail)
interface CommitmentDetailPreviewProps {
  commitmentId: number | string; // Accept number or string
}

// Placeholder hook (same as Detail)
const useGetCommitmentByIdQuery = (id: number | string | undefined) => {
  const [data, setData] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        setError(new Error("Commitment ID is missing"));
        return;
    }
    const loadCommitment = async () => {
      setIsLoading(true);
      setError(null);
      try {
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
    loadCommitment();
  }, [id]);

  return { data, isLoading, error };
};

// Update component definition to accept props and rename
const CommitmentDetailPreview: React.FC<CommitmentDetailPreviewProps> = ({ commitmentId }) => {
  const { t } = useTranslation();
  const id = commitmentId;
  const { data: commitment, isLoading, error } = useGetCommitmentByIdQuery(id);
  const [mapExpanded, setMapExpanded] = useState(true); // Keep map state
  const [participantDetails, setParticipantDetails] = useState<UserType[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [creatorDetails, setCreatorDetails] = useState<UserType | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  // Fetching logic remains the same
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

  // Loading/Error/Not Found states remain the same
  if (isLoading || loadingCreator) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 150 }}> {/* Reduced minHeight for preview */}
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 1 }}> {/* Reduced margin */}
        {t('commitments.detail.errorLoading', 'Failed to load commitment details.')} {error.message}
      </Alert>
    );
  }

  if (!commitment) {
    return (
      <Alert severity="warning" sx={{ m: 1 }}> {/* Reduced margin */}
        {t('commitments.detail.notFound', 'Commitment not found.')}
      </Alert>
    );
  }

  // Formatting and helper functions remain the same
  const formattedDate = new Date(commitment.dateTime).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const toggleMap = () => {
    setMapExpanded(!mapExpanded);
  };

  const getGoogleMapUrl = (location: string) => {
    const lowerCaseLocation = location.toLowerCase();
    if (lowerCaseLocation.includes('auckland') || 
        lowerCaseLocation.includes('university') || 
        lowerCaseLocation.includes('campus')) {
      return 'https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=University+of+Auckland,Auckland,New+Zealand&zoom=15';
    }
    const query = encodeURIComponent(location);
     return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`;
   };

   // isUniversityLocation function removed as it's unused in the preview

    const generateICalendarContent = () => {
      const startTime = new Date(commitment.dateTime);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const startDateFormatted = formatDate(startTime);
    const endDateFormatted = formatDate(endTime);
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Neurolink//Commitments//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', `UID:${commitment.id}@neurolink.app`, `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${startDateFormatted}`, `DTEND:${endDateFormatted}`, `SUMMARY:${commitment.title}`,
      `DESCRIPTION:${commitment.description.replace(/\n/g, '\\n')}`,
      commitment.location?.description ? `LOCATION:${commitment.location.description}` : '',
      'END:VEVENT', 'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
  };

  const downloadCalendarEvent = () => {
    const icsContent = generateICalendarContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${commitment.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    // Removed outer padding Box, padding will be handled by the parent CardContent
    <Box> 
      {/* Title section REMOVED */}

      {/* Main content container - single light shade containing everything */}
      {/* Reduced padding and margin */}
      <Paper
        elevation={0}
        sx={{
          p: 2, // Reduced padding
          mb: 2, // Reduced margin
          borderRadius: 2, // Slightly smaller radius
          backgroundColor: theme => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24'
        }}
      >
        {/* Commitment Title (Added back as smaller title) */}
         <AccessibleTypography 
          variant="h6" // Smaller title
          component="h3" // Appropriate heading level
          sx={{ 
            fontWeight: 600,
            fontSize: '1.1rem', // Smaller font size
            mb: 2 // Margin bottom
          }}
        >
          {commitment.title}
        </AccessibleTypography>

        {/* Date and Location */}
        <Stack direction="column" spacing={1.5} sx={{ mb: 2 }}> {/* Reduced spacing and margin */}
          {/* Date */}
          <Box display="flex" alignItems="center">
            <Calendar size={18} weight="regular" style={{ marginRight: 10 }} /> {/* Smaller icon */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessibleTypography variant="body2" sx={{ color: 'text.primary' }}> {/* Smaller variant */}
                {formattedDate}
              </AccessibleTypography>
              <IconButton
                size="small"
                onClick={downloadCalendarEvent}
                sx={{ ml: 0.5 }} // Reduced margin
                aria-label={t('commitments.detail.addToCalendar', 'Add to your calendar')}
                title={t('commitments.detail.addToCalendar', 'Add to your calendar')}
              >
                <Download size={14} /> {/* Smaller icon */}
              </IconButton>
            </Box>
          </Box>

          {/* Location */}
          {commitment.location?.description && (
            <Box>
              <Box display="flex" alignItems="center">
                <MapPin size={18} weight="regular" style={{ marginRight: 10 }} /> {/* Smaller icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <AccessibleTypography variant="body2" sx={{ color: 'text.primary' }}> {/* Smaller variant */}
                    {commitment.location.description}
                  </AccessibleTypography>
                  
                  <Box sx={{ display: 'flex', ml: 0.5 }}> {/* Reduced margin */}
                    <IconButton 
                      onClick={toggleMap} 
                      size="small"
                      aria-label={mapExpanded ? "Hide map" : "Show map"}
                      title={mapExpanded ? "Hide map" : "Show map"}
                    >
                      {mapExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />} {/* Smaller icon */}
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
                      <ArrowSquareOut size={14} /> {/* Smaller icon */}
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              
              <Collapse in={mapExpanded}>
                <Box 
                  sx={{ 
                    mt: 1.5, // Reduced margin
                    ml: 0, 
                    borderRadius: 1.5, // Smaller radius
                    overflow: 'hidden',
                    border: theme => `1px solid ${theme.palette.divider}`
                  }}
                >
                  <iframe 
                    src={getGoogleMapUrl(commitment.location.description)}
                    title="Location Map"
                    width="100%" 
                    height="250px" // Reduced height for preview
                    style={{ border: 'none' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    aria-label="Google Map showing location"
                  />
                  
                  {/* Map Footer - Simplified for preview */}
                  <Box sx={{ p: 1.5, textAlign: 'center', borderTop: theme => `1px solid ${theme.palette.divider}` }}>
                     <Link
                        href="https://maps.auckland.ac.nz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        <AccessibleTypography variant="caption"> {/* Smaller variant */}
                          {t('commitments.detail.viewCampusMap', 'View University of Auckland Campus Map')}
                        </AccessibleTypography>
                        <ArrowSquareOut size={12} /> {/* Smaller icon */}
                      </Link>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}
        </Stack>

        {/* Description label */}
        <Box display="flex" alignItems="center" sx={{ mb: 1.5 }}> {/* Reduced margin */}
          <TextT size={18} weight="regular" style={{ marginRight: 8 }} /> {/* Smaller icon */}
          <AccessibleTypography 
            variant="body1" // Smaller variant
            component="h4" // Appropriate heading level
            sx={{ fontWeight: 600 }}
          >
            {t('commitments.detail.description', 'Description')}
          </AccessibleTypography>
        </Box>

        {/* Description with darker shade */}
        <Paper
          elevation={0}
          sx={{
            p: 2, // Reduced padding
            borderRadius: 1.5, // Smaller radius
            backgroundColor: theme => theme.palette.mode === 'light' ? '#E5ECF6' : '#2a2a32'
          }}
        >
          <AccessibleTypography 
            variant="body2" // Smaller variant
            sx={{ 
              color: 'text.primary',
              lineHeight: 1.5 // Adjusted line height
            }}
          >
            {commitment.description}
          </AccessibleTypography>
        </Paper>
      </Paper>

      {/* Divider REMOVED */}

      {/* Creator and Participants section - single container */}
      {/* Reduced padding and margin */}
      <Paper
        elevation={0}
        sx={{
          p: 2, // Reduced padding
          borderRadius: 2, // Smaller radius
          backgroundColor: theme => theme.palette.mode === 'light' ? '#F7F9FB' : '#1e1e24'
        }}
      >
        {/* Creator section */}
        <Box mb={2.5}> {/* Reduced margin */}
          <Box display="flex" alignItems="center" sx={{ mb: 1.5 }}> {/* Reduced margin */}
            <User size={18} weight="regular" style={{ marginRight: 8 }} /> {/* Smaller icon */}
            <AccessibleTypography 
              variant="body1" // Smaller variant
              component="h4" // Appropriate heading level
              sx={{ fontWeight: 600 }}
            >
              {t('commitments.detail.creator', 'Created By')}
            </AccessibleTypography>
          </Box>
          
          <Box sx={{ ml: 1 }}> {/* Reduced margin */}
            {loadingCreator ? (
              <CircularProgress size={20} /> // Smaller size
            ) : creatorError ? (
              <Alert severity="error" sx={{ maxWidth: 'fit-content', fontSize: '0.8rem', p: 1 }}> {/* Smaller font/padding */}
                {creatorError}
              </Alert>
            ) : creatorDetails ? (
              <Stack 
                direction="row" 
                spacing={1} // Reduced spacing
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
                  sx={{ width: 28, height: 28 }} // Smaller avatar
                >
                  {!creatorDetails.profilePicture && creatorDetails.username.charAt(0).toUpperCase()} 
                </Avatar>
                <Box>
                  <AccessibleTypography 
                    variant="body2" // Smaller variant
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
              <Typography variant="body2">{commitment.creatorUsername}</Typography> // Smaller variant
            )}
          </Box>
        </Box>

        {/* Participants section */}
        <Box>
          <Box display="flex" alignItems="center" sx={{ mb: 1.5 }}> {/* Reduced margin */}
            <Users size={18} weight="regular" style={{ marginRight: 8 }} /> {/* Smaller icon */}
            <AccessibleTypography 
              variant="body1" // Smaller variant
              component="h4" // Appropriate heading level
              sx={{ fontWeight: 600 }}
            >
              {t('commitments.detail.participants', 'Participants')} ({commitment.participants.length})
            </AccessibleTypography>
          </Box>
          
          {loadingParticipants ? (
            <Box sx={{ ml: 1, py: 1 }}> {/* Reduced margin/padding */}
              <CircularProgress size={20} /> {/* Smaller size */}
            </Box>
          ) : participantError ? (
            <Alert severity="error" sx={{ ml: 1, fontSize: '0.8rem', p: 1 }}> {/* Smaller font/padding */}
              {participantError}
            </Alert>
          ) : commitment.participants.length > 0 ? (
            // Changed Grid layout: participants now take full width
            <Grid container spacing={1.5} sx={{ width: '100%', m: 0 }}> {/* Reduced spacing */}
              {participantDetails.map((user) => {
                const MAX_TAGS_DISPLAYED = 2; // Reduced max tags for preview
                
                const prioritizedTags = user.tags ? [
                  ...user.tags.filter(tag => ['skill', 'interest', 'programOfStudy'].includes(tag.type)),
                  ...user.tags.filter(tag => !['skill', 'interest', 'programOfStudy'].includes(tag.type))
                ].slice(0, MAX_TAGS_DISPLAYED) : [];
                
                // Changed Grid item to take full width (xs={12})
                return (
                  <Grid item xs={12} key={user.id || user.username} sx={{ display: 'flex' }}> 
                    <Paper
                      elevation={0}
                      sx={(theme) => ({ 
                        p: 2, // Reduced padding
                        borderRadius: 2, // Smaller radius
                        border: `1px solid ${theme.palette.divider}`,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      })}
                    >
                      {/* User header with avatar and name */}
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 1 }}> {/* Reduced spacing */}
                        <Avatar 
                          component={RouterLink}
                          to={`/people/${user.username}`}
                          src={user.profilePicture || undefined}
                          sx={{ width: 32, height: 32, cursor: 'pointer' }} // Slightly smaller avatar
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
                              variant="body1" // Adjusted variant
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
                          endIcon={<ArrowRight size={14} />} // Smaller icon
                          sx={{ 
                            borderRadius: '16px', // Adjusted radius
                            px: 1, // Reduced padding
                            py: 0.2, // Reduced padding
                            fontSize: '0.7rem', // Smaller font
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
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: user.bio ? 0.5 : 0 }}> {/* Reduced margin */}
                          {prioritizedTags.map((tag) => (
                            <Chip
                              key={`${tag.type}-${tag.value}`}
                              label={tag.value}
                              size="small"
                              sx={{ fontSize: '0.65rem' }} // Smaller font
                            />
                          ))}
                        </Box>
                      )}
                      
                      {/* Bio in card */}
                      {user.bio && (
                        <Paper 
                          elevation={0} 
                          sx={(theme) => ({ 
                            p: 1, // Reduced padding
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '6px', // Smaller radius
                            mb: 1,
                            fontSize: '0.75rem' // Smaller font
                          })}
                        >
                          <Typography variant="body2" color="text.primary" sx={{ 
                            fontSize: '0.75rem', // Smaller font
                            lineHeight: 1.3, // Adjusted line height
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // Reduced line clamp for preview
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {user.bio}
                          </Typography>
                        </Paper>
                      )}
                      
                      {/* View Full Profile button (Removed for preview, covered by header button) */}
                      {/* 
                      <Button 
                        variant="text" 
                        fullWidth
                        component={RouterLink}
                        to={`/people/${user.username}`}
                        sx={(theme) => ({ ... })}
                      >
                        {t('people.viewFullProfile', 'View Full Profile')}
                      </Button> 
                      */}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ ml: 1 }}> {/* Reduced margin */}
              <AccessibleTypography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}> {/* Smaller variant */}
                {t('commitments.detail.noParticipants', 'No participants listed.')}
              </AccessibleTypography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

// Update export name
export default CommitmentDetailPreview;
