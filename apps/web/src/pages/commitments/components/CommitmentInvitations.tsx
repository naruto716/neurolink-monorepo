// apps/web/src/pages/commitments/components/CommitmentInvitations.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Typography,
  Pagination,
  Button,
  Stack,
  Dialog, // Added Dialog components
  DialogTitle,
  DialogContent,
  IconButton,
  Paper, // Added Paper
  Grid, // Added Grid
  Avatar, // Added Avatar for the invitor chip
  Chip, // Ensure Chip is imported for the invitor display
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Added CloseIcon
import { Info } from '@phosphor-icons/react'; // Added Info icon for details button
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '@neurolink/shared/src/features/user/userSlice';
import {
  ReceivedInvitation,
  PaginatedReceivedInvitationsResponse,
  Commitment, // For Sent Invitations (which are Commitments)
  PaginatedSentInvitationsResponse,
  User as UserType, // Added UserType import
} from '@neurolink/shared'; // Import necessary types
import {
  fetchReceivedInvitations,
  fetchSentInvitations,
  respondToCommitmentInvitation, // Import the new API function
  fetchUserByUsername, // Added fetchUserByUsername import
} from '@neurolink/shared/src/features/user/userAPI';
import { SharedRootState } from '@neurolink/shared/src/app/store/store';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import apiClientInstance from '../../../app/api/apiClient';
import CommitmentDetail from './CommitmentDetail'; // Import CommitmentDetail
import { Link as RouterLink } from 'react-router-dom'; // Added RouterLink

const ITEMS_PER_PAGE = 5; // Or a different value if desired

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invitations-tabpanel-${index}`}
      aria-labelledby={`invitations-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `invitations-tab-${index}`,
    'aria-controls': `invitations-tabpanel-${index}`,
  };
}

const CommitmentInvitations: React.FC = () => {
  const { t } = useTranslation();
  const apiClient = apiClientInstance;
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));

  const [tabValue, setTabValue] = useState(0); // 0 for Received, 1 for Sent

  // State for Received Invitations
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvitation[]>([]);
  const [receivedLoading, setReceivedLoading] = useState<boolean>(false);
  const [receivedError, setReceivedError] = useState<string | null>(null);
  const [receivedPage, setReceivedPage] = useState<number>(1);
  const [receivedTotalPages, setReceivedTotalPages] = useState<number>(0);
  const [responseLoading, setResponseLoading] = useState<Record<number, boolean>>({}); // Loading state per invitation ID
  const [responseError, setResponseError] = useState<Record<number, string | null>>({}); // Error state per invitation ID

  // State for Sent Invitations
  const [sentInvites, setSentInvites] = useState<Commitment[]>([]); // Sent invites are Commitments
  const [sentLoading, setSentLoading] = useState<boolean>(false);
  const [sentError, setSentError] = useState<string | null>(null);
  const [sentPage, setSentPage] = useState<number>(1);
  const [sentTotalPages, setSentTotalPages] = useState<number>(0);

  // State for the details modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<number | null>(null);

  // >> NEW: State for Invitor Details <<
  const [invitorDetails, setInvitorDetails] = useState<Record<string, UserType>>({}); // Map username -> UserType
  const [loadingInvitors, setLoadingInvitors] = useState<boolean>(false);
  const [invitorError, setInvitorError] = useState<string | null>(null);
  // >> END NEW STATE <<

  const username = currentUser?.username;

  // Fetch Received Invitations
  const loadReceivedInvitations = useCallback(async (currentPage: number) => {
    if (!username || !apiClient) return;
    setReceivedLoading(true);
    setReceivedError(null);
    try {
      const params = { pageNumber: currentPage, pageSize: ITEMS_PER_PAGE };
      const response: PaginatedReceivedInvitationsResponse = await fetchReceivedInvitations(
        apiClient,
        username,
        params
      );
      setReceivedInvites(response.items);
      setReceivedTotalPages(response.totalPages);
      setReceivedPage(response.pageNumber);

      // >> NEW: Trigger fetching invitor details after invites are loaded <<
      // Extract unique creator usernames
      const creatorUsernames = [...new Set(response.items.map(invite => invite.commitment.creatorUsername))];
      // Fetch details for usernames not already fetched
      const usernamesToFetch = creatorUsernames.filter(uname => !invitorDetails[uname]);
      if (usernamesToFetch.length > 0) {
        setLoadingInvitors(true);
        setInvitorError(null);
        try {
          const invitorPromises = usernamesToFetch.map(uname => 
            fetchUserByUsername(apiClient, uname)
          );
          const results = await Promise.allSettled(invitorPromises);
          const newInvitorDetails: Record<string, UserType> = {};
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              newInvitorDetails[usernamesToFetch[index]] = result.value;
            } else {
              console.error(`Failed to load invitor details for ${usernamesToFetch[index]}:`, result.reason);
              // Optionally set a general error, or handle per-user errors if needed
              setInvitorError(t('commitments.invitations.errorLoadingInvitors', 'Failed to load some invitor details.'));
            }
          });
          setInvitorDetails(prev => ({ ...prev, ...newInvitorDetails }));
        } catch (err) {
            console.error('Error fetching invitor details:', err);
            setInvitorError(t('commitments.invitations.errorLoadingInvitors', 'Failed to load some invitor details.'));
        } finally {
            setLoadingInvitors(false);
        }
      }
      // >> END NEW FETCH LOGIC <<

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setReceivedError(msg || t('commitments.invitations.errorLoadingReceived'));
      setReceivedInvites([]);
      setReceivedTotalPages(0);
    } finally {
      setReceivedLoading(false);
    }
  }, [apiClient, username, t, invitorDetails]);

  // Fetch Sent Invitations
  const loadSentInvitations = useCallback(async (currentPage: number) => {
    if (!username || !apiClient) return;
    setSentLoading(true);
    setSentError(null);
    try {
      const params = { pageNumber: currentPage, pageSize: ITEMS_PER_PAGE };
      // Note: fetchSentInvitations returns PaginatedSentInvitationsResponse which is PaginatedCommitmentsResponse
      const response: PaginatedSentInvitationsResponse = await fetchSentInvitations(
        apiClient,
        username,
        params
      );
      setSentInvites(response.items);
      setSentTotalPages(response.totalPages);
      setSentPage(response.pageNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSentError(msg || t('commitments.invitations.errorLoadingSent'));
      setSentInvites([]);
      setSentTotalPages(0);
    } finally {
      setSentLoading(false);
    }
  }, [apiClient, username, t]);

  // Handler for responding to an invitation
  const handleInvitationResponse = useCallback(async (invitationId: number, status: 'accepted' | 'rejected') => {
    if (!apiClient) return;

    setResponseLoading(prev => ({ ...prev, [invitationId]: true }));
    setResponseError(prev => ({ ...prev, [invitationId]: null }));

    try {
      const updatedInvitation = await respondToCommitmentInvitation(apiClient, invitationId, status);
      // Update the local state to reflect the change immediately
      setReceivedInvites(prevInvites =>
        prevInvites.map(invite =>
          invite.id === invitationId ? updatedInvitation : invite
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResponseError(prev => ({ ...prev, [invitationId]: msg || t('commitments.invitations.errorResponding') }));
    } finally {
      setResponseLoading(prev => ({ ...prev, [invitationId]: false }));
    }
  }, [apiClient, t]);

  // --- Modal Handlers ---
  const handleViewDetails = (commitmentId: number) => {
    setSelectedCommitmentId(commitmentId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCommitmentId(null); // Clear selection on close
  };
  // --- End Modal Handlers ---


  // Effects to load data when tab or page changes
  useEffect(() => {
    if (username && tabValue === 0) {
      loadReceivedInvitations(receivedPage);
    }
  }, [username, tabValue, receivedPage, loadReceivedInvitations]);

  useEffect(() => {
    if (username && tabValue === 1) {
      loadSentInvitations(sentPage);
    }
  }, [username, tabValue, sentPage, loadSentInvitations]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset pages when switching tabs
    setReceivedPage(1);
    setSentPage(1);
  };

  const handleReceivedPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setReceivedPage(value);
  };

  const handleSentPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setSentPage(value);
  };

  // Helper to format date (consider moving to a shared util)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <AccessibleTypography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {t('commitments.invitations.title', 'Commitment Invitations')}
      </AccessibleTypography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="commitment invitations tabs">
          <Tab label={t('commitments.invitations.receivedTab', 'Received')} {...a11yProps(0)} />
          <Tab label={t('commitments.invitations.sentTab', 'Sent')} {...a11yProps(1)} />
        </Tabs>
      </Box>

      {/* Display general invitor loading error if present */}
      {invitorError && (
          <Alert severity="warning" sx={{ my: 1.5, mx: 1 }}> 
             {invitorError}
          </Alert>
      )}

      {/* Received Invitations Panel */}
      <TabPanel value={tabValue} index={0}>
        {receivedLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {receivedError && <Alert severity="error" sx={{ my: 2 }}>{receivedError}</Alert>}
        {!receivedLoading && !receivedError && receivedInvites.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
            {t('commitments.invitations.noReceived', 'No received invitations found.')}
          </Typography>
        )}
        {!receivedLoading && !receivedError && receivedInvites.length > 0 && (
          <Box>
            {/* Wrap list in Grid container */}
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
              {receivedInvites.map((invite) => {
                const isLoading = responseLoading[invite.id];
                const errorMsg = responseError[invite.id];
                const isPending = invite.status.toLowerCase() === 'pending';
                // Get invitor details from state
                const invitor = invitorDetails[invite.commitment.creatorUsername];

                return (
                  // Wrap item in Grid item
                  <Grid item xs={12} sm={6} md={6} key={invite.id} sx={{ display: 'flex' }}>
                    {/* Use Paper for the card */}
                    <Paper
                      elevation={0}
                      sx={(theme) => ({
                        p: 2.5, // Consistent padding
                        borderRadius: 3, // Consistent radius
                        border: `1px solid ${theme.palette.divider}`, // Consistent border
                        height: '100%',
                        width: '100%', // Ensure paper takes full width of grid item
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5 // Add gap between content sections
                      })}
                    >
                      {/* Top section: Details, Status Tag, Details Button */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                        {/* Left side: Title and Invitor Chip */}
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                          <AccessibleTypography variant="subtitle1" fontWeight="medium" noWrap title={invite.commitment.title}>
                            {invite.commitment.title}
                          </AccessibleTypography>
                          
                          {/* Invitor Chip/Loading */}
                          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                                {t('commitments.invitations.from', 'From')}:
                            </Typography>
                            {loadingInvitors && !invitor ? (
                              <CircularProgress size={16} sx={{ ml: 1 }} />
                            ) : invitor ? (
                              <Chip
                                component={RouterLink}
                                to={`/people/${invitor.username}`}
                                clickable
                                avatar={
                                  <Avatar 
                                    src={invitor.profilePicture || undefined}
                                    sx={{ width: 26, height: 26 }}
                                  >
                                    {!invitor.profilePicture && invitor.username.charAt(0).toUpperCase()}
                                  </Avatar>
                                }
                                label={invitor.displayName || invitor.username}
                                size="small"
                                sx={(theme) => ({ 
                                  height: 'auto', 
                                  maxWidth: 'calc(100% - 50px)',
                                  backgroundColor: theme.palette.background.paper, // White background
                                  border: `1px solid ${theme.palette.divider}`, // Neutral border
                                  color: theme.palette.text.primary, // Standard text color
                                  borderRadius: '16px', // Rounded shape
                                  '& .MuiChip-avatar': { 
                                      margin: '1px -2px 1px 3px' 
                                  },
                                  '& .MuiChip-label': {
                                    py: 0.2,
                                    px: 0.6,
                                    fontSize: '0.75rem' 
                                  }
                                })}
                              />
                            ) : (
                               // Fallback if loading failed or user not found
                              <Typography variant="body2" color="text.secondary">
                                {invite.commitment.creatorUsername}
                              </Typography>
                            )}
                          </Box>
                          
                          {/* Date and Location */}
                          <AccessibleTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {t('common.date')}: {formatDate(invite.commitment.dateTime)}
                          </AccessibleTypography>
                          <AccessibleTypography variant="body2" color="text.secondary" noWrap title={invite.commitment.location.description}>
                             {t('commitments.table.location')}: {invite.commitment.location.description}
                          </AccessibleTypography>
                        </Box>
                        {/* Right side: Status Tag and Details Button */}
                        <Stack direction="column" spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                          {/* Custom Status Tag */}
                          <Box
                            sx={(theme) => {
                              const statusLower = invite.status.toLowerCase();
                              let statusColor = theme.palette.warning.main;

                              if (statusLower === 'accepted') {
                                statusColor = theme.palette.success.main;
                              } else if (statusLower === 'rejected') {
                                statusColor = theme.palette.error.main;
                              }
                              
                              // New styles for white background, colored border/text
                              return {
                                display: 'inline-block',
                                px: 1.2,
                                py: 0.4,
                                borderRadius: '16px', // More rounded corners
                                backgroundColor: theme.palette.background.paper, // White background
                                border: `1px solid ${statusColor}`, // Colored border
                                color: statusColor, // Colored text
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                                whiteSpace: 'nowrap'
                              };
                            }}
                          >
                            {t(`commitments.invitations.status.${invite.status.toLowerCase()}`, invite.status)}
                          </Box>

                          {/* Details Button */}
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleViewDetails(invite.commitmentId)}
                            startIcon={<Info size={16} weight="regular" />}
                            sx={{ 
                              flexShrink: 0, 
                              minWidth: 'auto',
                              lineHeight: 1 // Adjust line height for better vertical alignment with tag
                            }}
                          >
                            {t('common.details', 'Details')}
                          </Button>
                        </Stack>
                      </Box>

                      {/* Bottom section: Action Buttons (only if pending) */}
                       {/* Use Box with mt: 'auto' to push buttons to bottom */}
                      <Box sx={{ mt: 'auto', width: '100%' }}>
                        {isPending && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center" justifyContent="flex-end"> {/* Align buttons to right */}
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              onClick={() => handleInvitationResponse(invite.id, 'accepted')}
                              disabled={isLoading}
                              sx={{ flexGrow: 1 }} // Make buttons take equal space if needed, or adjust as preferred
                            >
                              {isLoading ? <CircularProgress size={20} color="inherit" /> : t('common.accept', 'Accept')}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleInvitationResponse(invite.id, 'rejected')}
                              disabled={isLoading}
                              sx={{ flexGrow: 1 }} // Make buttons take equal space
                            >
                              {isLoading ? <CircularProgress size={20} color="inherit" /> : t('common.reject', 'Reject')}
                            </Button>
                          </Stack>
                        )}
                        {/* Display error if response failed */}
                        {errorMsg && <Alert severity="error" sx={{ mt: 1, p: '0 8px', fontSize: '0.8rem', width: 'fit-content', ml: 'auto' }}>{errorMsg}</Alert>}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid> {/* Close Grid container */}
            {receivedTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={receivedTotalPages}
                  page={receivedPage}
                  onChange={handleReceivedPageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}
      </TabPanel>

      {/* Sent Invitations Panel */}
      <TabPanel value={tabValue} index={1}>
        {sentLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {sentError && <Alert severity="error" sx={{ my: 2 }}>{sentError}</Alert>}
        {!sentLoading && !sentError && sentInvites.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
            {t('commitments.invitations.noSent', 'No sent invitations found.')}
          </Typography>
        )}
        {!sentLoading && !sentError && sentInvites.length > 0 && (
          <Box>
            {/* Wrap list in Grid container */}
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
              {sentInvites.map((invite) => (
                // Wrap item in Grid item
                <Grid item xs={12} sm={6} md={6} key={invite.id} sx={{ display: 'flex' }}>
                  {/* Use Paper for the card */}
                  <Paper
                    elevation={0}
                    sx={(theme) => ({
                      p: 2.5, // Consistent padding
                      borderRadius: 3, // Consistent radius
                      border: `1px solid ${theme.palette.divider}`, // Consistent border
                      height: '100%',
                      width: '100%', // Ensure paper takes full width of grid item
                      display: 'flex',
                      flexDirection: 'column', // Stack content vertically
                      justifyContent: 'space-between' // Push button to bottom
                    })}
                  >
                    {/* Top part: Details */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                       <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                         <AccessibleTypography variant="subtitle1" fontWeight="medium" noWrap title={invite.title}>
                           {invite.title}
                         </AccessibleTypography>
                         <AccessibleTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                           {t('common.date')}: {formatDate(invite.dateTime)}
                         </AccessibleTypography>
                         <AccessibleTypography variant="body2" color="text.secondary" noWrap title={invite.location.description}>
                           {t('commitments.table.location')}: {invite.location.description}
                         </AccessibleTypography>
                       </Box>
                       {/* Button aligned top-right */}
                       <Button
                         variant="text"
                         size="small"
                         onClick={() => handleViewDetails(invite.id)}
                         startIcon={<Info size={16} weight="regular" />}
                         sx={{ flexShrink: 0, minWidth: 'auto', p: '4px 8px' }}
                       >
                         {t('common.details', 'Details')}
                       </Button>
                    </Box>
                     {/* Bottom part: Maybe display participants invited? */}
                     {/* <Box sx={{ mt: 'auto' }}> // Pushes this section down if needed
                       <AccessibleTypography variant="caption" color="text.secondary">
                         Invited: {invite.participants?.map(p => p.username).join(', ') || 'None'}
                       </AccessibleTypography>
                     </Box> */}
                  </Paper>
                </Grid>
              ))}
            </Grid> {/* Close Grid container */}
            {sentTotalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={sentTotalPages}
                  page={sentPage}
                  onChange={handleSentPageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}
      </TabPanel>

      {/* --- Modal Dialog --- */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="commitment-detail-dialog-title"
        maxWidth="md" // Adjust size as needed
        fullWidth
      >
        {/* Render title only when an ID is selected to prevent errors during closing animation */}
        {selectedCommitmentId && (
          <DialogTitle id="commitment-detail-dialog-title" sx={{ m: 0, p: 2 }}>
            {t('commitments.detail.modalTitle', 'Commitment Details')}
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
        )}
        <DialogContent dividers>
          {/* Render CommitmentDetail only when an ID is selected */}
          {/* Pass the selected ID as a prop */}
          {selectedCommitmentId && (
            <CommitmentDetail commitmentId={selectedCommitmentId} />
          )}
        </DialogContent>
      </Dialog>
      {/* --- End Modal Dialog --- */}

    </Box>
  );
};

export default CommitmentInvitations;
