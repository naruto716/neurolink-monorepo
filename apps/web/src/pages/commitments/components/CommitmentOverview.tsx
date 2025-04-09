import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios for error checking
import { useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Avatar,
  Box,
  Button,
  Skeleton,
  Alert,
  Stack,
  Chip,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Updated imports for commitments
import { 
  selectCurrentUser, 
  ReceivedInvitation, 
  fetchReceivedInvitations, 
  User as UserType, 
  fetchUserByUsername,
  Commitment, // Added Commitment type
  // fetchUserCommitments, // Removed as it's no longer used directly here
  fetchPendingInvitationCount, 
  fetchAcceptedCommitmentCount 
} from '@neurolink/shared';
import { SharedRootState } from '@neurolink/shared';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography'; // Adjusted path
import CommitmentList from './CommitmentList'; // Import the new list component
import CommitmentDetailPreview from './CommitmentDetailPreview'; // Import CommitmentDetailPreview
import apiClientInstance from '../../../app/api/apiClient'; // Added apiClient

// Removed hardcodedInvitations data

const INVITATIONS_PREVIEW_COUNT = 4; // Max invitations to show in preview

const CommitmentOverview: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme(); // Get the theme object
  const apiClient = apiClientInstance;
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));
  
  // State for Invitations Preview
  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState<boolean>(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);

  // >> NEW: State for Invitor Details <<
  const [invitorDetails, setInvitorDetails] = useState<Record<string, UserType>>({}); // Map username -> UserType
  const [loadingInvitors, setLoadingInvitors] = useState<boolean>(false);
  // >> END NEW STATE <<

  // >> NEW: State for Counts <<
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [acceptedCount, setAcceptedCount] = useState<number | null>(null);
  const [countsLoading, setCountsLoading] = useState<boolean>(false);
  const [countsError, setCountsError] = useState<string | null>(null);
  // >> END NEW STATE <<

  // >> NEW: State for Next Commitment <<
  const [nextCommitment, setNextCommitment] = useState<Commitment | null>(null);
  const [nextCommitmentLoading, setNextCommitmentLoading] = useState<boolean>(false);
  const [nextCommitmentError, setNextCommitmentError] = useState<string | null>(null);
  // >> END NEW STATE <<

  const username = currentUser?.username;

  // Fetch Invitations Preview
  const loadInvitationsPreview = useCallback(async () => {
    if (!username || !apiClient) return;
    setInvitationsLoading(true);
    setInvitationsError(null);
    // Reset invitor details on new load if needed, or manage staleness
    // setInvitorDetails({}); 
    // setInvitorError(null);
    try {
      const params = { pageNumber: 1, pageSize: INVITATIONS_PREVIEW_COUNT };
      const response = await fetchReceivedInvitations(apiClient, username, params);
      setInvitations(response.items);

      // >> NEW: Fetch Invitor Details <<
      const creatorUsernames = [...new Set(response.items.map(invite => invite.commitment.creatorUsername))];
      const usernamesToFetch = creatorUsernames.filter(uname => !invitorDetails[uname]);
      if (usernamesToFetch.length > 0) {
          setLoadingInvitors(true);
          // We won't set a specific error message in the preview, just log it
          // setInvitorError(null); 
          try {
              const invitorPromises = usernamesToFetch.map(uname => fetchUserByUsername(apiClient, uname));
              const results = await Promise.allSettled(invitorPromises);
              const newInvitorDetails: Record<string, UserType> = {};
              results.forEach((result, index) => {
                  if (result.status === 'fulfilled') {
                      newInvitorDetails[usernamesToFetch[index]] = result.value;
                  } else { 
                      console.error(`Overview: Failed invitor details for ${usernamesToFetch[index]}:`, result.reason);
                      // setInvitorError('Failed to load some invitor details.'); // Optional error state
                  }
              });
              setInvitorDetails(prev => ({ ...prev, ...newInvitorDetails }));
          } catch (err) {
              console.error('Overview: Error fetching invitor details:', err);
              // setInvitorError('Failed to load some invitor details.');
          } finally {
              setLoadingInvitors(false);
          }
      }
      // >> END NEW FETCH LOGIC <<

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInvitationsError(msg || t('commitments.invitations.errorLoadingReceived')); // Use specific error key
      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }, [apiClient, username, t]); // REMOVED invitorDetails

  // >> NEW: Fetch Counts Logic <<
  const loadCounts = useCallback(async () => {
    if (!apiClient) return;
    setCountsLoading(true);
    setCountsError(null);
    try {
      const [pendingResult, acceptedResult] = await Promise.allSettled([
        fetchPendingInvitationCount(apiClient),
        fetchAcceptedCommitmentCount(apiClient)
      ]);

      if (pendingResult.status === 'fulfilled') {
        setPendingCount(pendingResult.value);
      } else {
        console.error('Failed to fetch pending invitation count:', pendingResult.reason);
        setPendingCount(null); // Indicate error or keep previous value?
        setCountsError(prev => prev ? `${prev}, Pending count failed` : 'Pending count failed'); // Append or set error
      }

      if (acceptedResult.status === 'fulfilled') {
        setAcceptedCount(acceptedResult.value);
      } else {
        console.error('Failed to fetch accepted commitment count:', acceptedResult.reason);
        setAcceptedCount(null); // Indicate error
        setCountsError(prev => prev ? `${prev}, Accepted count failed` : 'Accepted count failed');
      }

    } catch (err) { // Catch potential issues with Promise.allSettled itself (unlikely)
      console.error('Failed to load commitment counts:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load counts';
      setCountsError(msg);
      setPendingCount(null);
      setAcceptedCount(null);
    } finally {
      setCountsLoading(false);
    }
  }, [apiClient]);
  // >> END NEW FETCH LOGIC <<

  // >> NEW: Fetch Next Commitment Logic <<
  const loadNextCommitment = useCallback(async () => {
    // No username needed for this specific endpoint
    if (!apiClient) return;
    setNextCommitmentLoading(true);
    setNextCommitmentError(null);
    try {
      // Call the new endpoint directly
      const response = await apiClient.get<Commitment>('/commitment/my/next'); // Corrected path
      // The endpoint returns the commitment directly, or potentially 404/error if none exists
      setNextCommitment(response.data);
    } catch (err: unknown) {
      // Handle potential 404 (no next commitment) or other errors
      if (axios.isAxiosError(err) && err.response?.status === 404) {
         setNextCommitment(null); // No next commitment found is not an error state here
         console.log('No upcoming commitment found.');
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        // Use a more specific translation key for the error message
        setNextCommitmentError(msg || t('commitments.nextCommitment.errorLoadingNext'));
        setNextCommitment(null);
        console.error('Failed to fetch next commitment:', err);
      }
    } finally {
      setNextCommitmentLoading(false);
    }
  }, [apiClient, t]); // Removed username dependency
  // >> END NEW FETCH LOGIC <<

  useEffect(() => {
    loadInvitationsPreview();
    loadCounts(); // Load counts on mount
    loadNextCommitment(); // Load next commitment on mount
  }, [loadInvitationsPreview, loadCounts, loadNextCommitment]); // Add loadNextCommitment dependency

  // Re-add formatDate helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <> {/* Use Fragment as we don't need a container here */}
      {/* Top User Section */}
      {/* Adjust padding and remove gap to reduce height */}
      <Card sx={{
          mb: 3,
          display: 'flex',
          padding: '16px', // Reduced padding
          alignItems: 'center', // Center items vertically
          // gap: '28px', // Remove gap, Grid spacing handles internal layout
          flexShrink: 0,
          borderRadius: '16px',
          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#F7F9FB' : theme.palette.background.paper,
          minHeight: 'auto', // Override default theme minHeight
          '& > .MuiCardContent-root': {
             padding: 0,
             '&:last-child': {
                paddingBottom: '0 !important'
             }
          }
      }}>
        <CardContent sx={{ display: 'flex', flexGrow: 1, width: '100%', p: 0 }}>
          {/* Reduce Grid spacing */}
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              {/* Use profilePicture if available, otherwise fallback to letter */}
              <Avatar
                src={currentUser?.profilePicture || undefined}
                sx={{ width: 40, height: 40 }} // Reduced Avatar size
              >
                {/* Fallback to first letter of displayName or username */}
                {!currentUser?.profilePicture && (currentUser?.displayName || currentUser?.username || 'U')[0].toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              {/* Reduce bottom margin on Typography */}
              {/* Use smaller variant and remove bottom margin */}
              <AccessibleTypography variant="h6" component="div" sx={{ mb: 0 }}>
                {t('commitments.welcome', { name: currentUser?.displayName || currentUser?.username || t('common.user') })}
              </AccessibleTypography>
              <AccessibleTypography variant="body2" color="text.secondary">
                {t('commitments.userSubtitle')}
              </AccessibleTypography>
            </Grid>
            {/* Stats Section - Updated */}
            <Grid item>
              {/* Wrap Accepted Count Box in RouterLink */}
              <Box 
                component={RouterLink} 
                to="/commitments/my-commitments" 
                textAlign="center" 
                sx={{
                  textDecoration: 'none',
                  color: 'inherit', 
                  display: 'block',
                  // Apply hover color from theme
                  '&:hover .MuiTypography-root': { 
                    color: '#95A4FC', // Link hover color from theme.ts
                    transition: 'color 0.2s ease-in-out',
                  }
                }}
              >
                {/* Accepted Commitments Count */}
                {countsLoading ? (
                  <Skeleton variant="text" width={20} height={24} sx={{ mx: 'auto' }} />
                ) : (
                  <AccessibleTypography variant="body1" fontWeight="medium" className="MuiTypography-root">
                    {countsError && acceptedCount === null ? '!' : acceptedCount ?? '-'}
                  </AccessibleTypography>
                )}
                <AccessibleTypography variant="caption" color="text.secondary" sx={{ display: 'block' }} className="MuiTypography-root">
                  {t('commitments.totalCommitments')}
                </AccessibleTypography>
              </Box>
            </Grid>
            <Grid item>
               {/* Wrap Pending Count Box in RouterLink */}
               <Box 
                 component={RouterLink} 
                 to="/commitments/invitations" 
                 textAlign="center"
                 sx={{
                   textDecoration: 'none',
                   color: 'inherit',
                   display: 'block',
                   // Apply hover color from theme
                   '&:hover .MuiTypography-root': { 
                     color: '#95A4FC', // Link hover color from theme.ts
                     transition: 'color 0.2s ease-in-out',
                   }
                 }}
               >
                {/* Pending Invitations Count */}
                {countsLoading ? (
                  <Skeleton variant="text" width={20} height={24} sx={{ mx: 'auto' }} />
                ) : (
                  <AccessibleTypography variant="body1" fontWeight="medium" className="MuiTypography-root">
                     {countsError && pendingCount === null ? '!' : pendingCount ?? '-'}
                  </AccessibleTypography>
                )}
                <AccessibleTypography variant="caption" color="text.secondary" sx={{ display: 'block' }} className="MuiTypography-root">
                  {t('commitments.pendingInvitations')}
                </AccessibleTypography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Middle Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left: Next Commitment - Updated */}
        <Grid item xs={12} md={6}>
          {/* Ensure Card takes full height and content can scroll */}
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}> {/* Allow content to grow and hide overflow initially */}
              <AccessibleTypography variant="h6" gutterBottom sx={{ flexShrink: 0 }}> {/* Prevent title from shrinking */}
                 {/* Use the correct translation key for the title */}
                {t('commitments.nextCommitment.title')}
              </AccessibleTypography>

              {/* Scrollable Content Area - Added maxHeight */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mr: -1, maxHeight: '500px' }}> {/* Added maxHeight */}
                {nextCommitmentLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '150px' }}>
                    <CircularProgress />
                  </Box>
                )}
                {nextCommitmentError && !nextCommitmentLoading && (
                  <Alert severity="error" sx={{ my: 1 }}>{nextCommitmentError}</Alert>
                )}
                {!nextCommitmentLoading && !nextCommitmentError && nextCommitment && (
                  // Render CommitmentDetailPreview, passing the ID
                  // Note: CommitmentDetailPreview handles its own internal loading/error states
                  <CommitmentDetailPreview commitmentId={nextCommitment.id} />
                )}
                {!nextCommitmentLoading && !nextCommitmentError && !nextCommitment && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '150px' }}>
                    <AccessibleTypography variant="body1" color="text.secondary" textAlign="center">
                      {t('commitments.noCommitmentsFound')} {/* Changed message slightly */}
                    </AccessibleTypography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Invitations Preview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}> {/* Ensure card content can grow and button stays at bottom */}
            <CardContent sx={{ flexGrow: 1 }}>
              <AccessibleTypography variant="h6" gutterBottom>{t('commitments.invitations.title')}</AccessibleTypography>
              
              {/* Loading State - Update Skeleton */}
              {invitationsLoading && (
                 <Stack spacing={2}>
                     {Array.from(new Array(INVITATIONS_PREVIEW_COUNT)).map((_, index) => (
                         // Use theme variable for border
                         <Box key={`inv-skel-${index}`} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                                <Skeleton variant="rounded" width={60} height={20} /> { /* Skeleton for status */}
                             </Box>
                             <Skeleton variant="text" width="50%" sx={{ fontSize: '0.875rem' }} /> { /* Skeleton for invitor */}
                             <Skeleton variant="text" width="60%" sx={{ fontSize: '0.875rem' }} /> { /* Skeleton for date */}
                         </Box>
                     ))}
                 </Stack>
              )}

              {/* Error State */} 
              {!invitationsLoading && invitationsError && (
                 <Alert severity="error" sx={{ my: 1 }}>{invitationsError}</Alert>
              )}

              {/* Empty/Loaded State - Update Rendering */}
              {!invitationsLoading && !invitationsError && (
                 <Stack spacing={0} sx={{ flexGrow: 1 }}> {/* Remove spacing, use border/padding on Box */}
                     {invitations.length > 0 ? (
                         invitations.map((invite, index) => {
                             const invitor = invitorDetails[invite.commitment.creatorUsername];
                             // Determine status color for tag
                             const statusLower = invite.status.toLowerCase();
                             let statusColor = theme.palette.warning.main;
                             if (statusLower === 'accepted') statusColor = theme.palette.success.main;
                             else if (statusLower === 'rejected') statusColor = theme.palette.error.main;

                             return (
                                 // Use theme variable for border
                                 <Box key={invite.id} sx={{ 
                                     py: 1.5, 
                                     borderBottom: index < invitations.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' // Add divider except for last item
                                 }}>
                                     {/* Top Row: Title and Status */}
                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                         <AccessibleTypography variant="subtitle1" noWrap title={invite.commitment.title}>
                                             {invite.commitment.title}
                                         </AccessibleTypography>
                                         {/* Status Tag - Use theme variable */}
                                          <Box sx={{ display: 'inline-block', px: 1, py: 0.2, borderRadius: '12px', backgroundColor: theme.palette.background.paper, border: `1px solid ${statusColor}`, color: statusColor, fontSize: '0.7rem', fontWeight: 500, textTransform: 'capitalize', whiteSpace: 'nowrap', ml: 1, flexShrink: 0 }}>
                                            {t(`commitments.invitations.status.${statusLower}`, invite.status)}
                                          </Box>
                                     </Box>
                                     
                                     {/* Invitor Chip - Use theme variable */}
                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                         <Typography variant="body2" color="text.secondary">
                                             {t('commitments.invitations.from')}:
                                         </Typography>
                                         {loadingInvitors && !invitor ? (
                                             <CircularProgress size={16} />
                                         ) : invitor ? (
                                             <Chip component={RouterLink} to={`/people/${invitor.username}`} clickable 
                                                 avatar={<Avatar src={invitor.profilePicture || undefined} sx={{ width: 22, height: 22 }}>{!invitor.profilePicture && invitor.username.charAt(0).toUpperCase()}</Avatar>}
                                                 label={invitor.displayName || invitor.username} size="small"
                                                 sx={{ height: 'auto', maxWidth: 'calc(100% - 60px)', backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary, borderRadius: '16px', '& .MuiChip-avatar': { margin: '1px -2px 1px 3px' }, '& .MuiChip-label': { py: 0.2, px: 0.6, fontSize: '0.75rem' } }} 
                                             />
                                         ) : (
                                             <Typography variant="body2" color="text.secondary">{invite.commitment.creatorUsername}</Typography>
                                         )}
                                     </Box>
                                     
                                     {/* Date */}
                                     <AccessibleTypography variant="caption" color="text.secondary" display="block">
                                         {formatDate(invite.commitment.dateTime)}
                                     </AccessibleTypography>
                                 </Box>
                             );
                         })
                     ) : (
                         <AccessibleTypography variant="body1" color="text.secondary">
                             {t('commitments.noPendingInvitations')}
                         </AccessibleTypography>
                     )}
                 </Stack>
              )}
            </CardContent>
            {/* "More" Button */}
            <Box sx={{ p: 2, pt: invitations.length > 0 ? 2 : 0, mt: 'auto' }}>
                 <Button 
                    component={RouterLink} 
                    to="/commitments/invitations"
                    fullWidth 
                    variant="outlined" 
                    size="small"
                 >
                     {t('common.viewAll', 'View All Invitations')}
                 </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section: Render the CommitmentList component */}
      <Card>
        <CardContent>
          {/* CommitmentList handles its own title, loading, error, and pagination */}
          <CommitmentList />
        </CardContent>
      </Card>
    </>
  );
};

export default CommitmentOverview;
