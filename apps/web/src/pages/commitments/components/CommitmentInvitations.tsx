// apps/web/src/pages/commitments/components/CommitmentInvitations.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Tabs,
  Tab,
  Alert,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Grid,
  Avatar,
  Chip,
  Skeleton,
  Button,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Info } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '@neurolink/shared/src/features/user/userSlice';
import {
  ReceivedInvitation,
  Commitment,
  User as UserType,
} from '@neurolink/shared';
import {
  fetchReceivedInvitations,
  fetchSentInvitations,
  respondToCommitmentInvitation,
  fetchUserByUsername,
} from '@neurolink/shared/src/features/user/userAPI';
import { SharedRootState } from '@neurolink/shared/src/app/store/store';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import apiClientInstance from '../../../app/api/apiClient';
import CommitmentDetail from './CommitmentDetail';
import { Link as RouterLink } from 'react-router-dom';

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
  const [receivedNextPage, setReceivedNextPage] = useState<number>(1);
  const [hasMoreReceived, setHasMoreReceived] = useState<boolean>(true);
  const isLoadingMoreReceived = useRef(false);
  const [responseLoading, setResponseLoading] = useState<Record<number, boolean>>({}); // Loading state per invitation ID
  const [responseError, setResponseError] = useState<Record<number, string | null>>({}); // Error state per invitation ID

  // State for Sent Invitations
  const [sentInvites, setSentInvites] = useState<Commitment[]>([]); // Sent invites are Commitments
  const [sentLoading, setSentLoading] = useState<boolean>(false);
  const [sentError, setSentError] = useState<string | null>(null);
  const [sentNextPage, setSentNextPage] = useState<number>(1);
  const [hasMoreSent, setHasMoreSent] = useState<boolean>(true);
  const isLoadingMoreSent = useRef(false);

  // State for the details modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<number | null>(null);

  // >> NEW: State for Invitor Details <<
  const [invitorDetails, setInvitorDetails] = useState<Record<string, UserType>>({}); // Map username -> UserType
  const [loadingInvitors, setLoadingInvitors] = useState<boolean>(false);
  const [invitorError, setInvitorError] = useState<string | null>(null);
  // >> END NEW STATE <<

  const username = currentUser?.username;

  // Fetch Received Invitations (Modified for Infinite Scroll)
  const loadReceivedInvitations = useCallback(async (page: number, isInitialLoad: boolean = false) => {
    if (!username || !apiClient || isLoadingMoreReceived.current) return;

    if (isInitialLoad) {
      setReceivedLoading(true);
      setReceivedInvites([]); // Clear on initial load
      setReceivedNextPage(1);
      setHasMoreReceived(true);
    } else {
      isLoadingMoreReceived.current = true;
      // Optionally show a smaller loading indicator at the bottom while loading more
    }
    setReceivedError(null);
    
    try {
      const params = { pageNumber: page, pageSize: ITEMS_PER_PAGE };
      const response = await fetchReceivedInvitations(apiClient, username, params);
      
      setReceivedInvites(prev => isInitialLoad ? response.items : [...prev, ...response.items]);
      setReceivedNextPage(page + 1);
      setHasMoreReceived(response.items.length === ITEMS_PER_PAGE);

      // Fetch invitor details logic (should still work, maybe optimize later)
      const creatorUsernames = [...new Set(response.items.map(invite => invite.commitment.creatorUsername))];
      const usernamesToFetch = creatorUsernames.filter(uname => !invitorDetails[uname]);
      if (usernamesToFetch.length > 0) {
          setLoadingInvitors(true);
          setInvitorError(null);
          try {
            const invitorPromises = usernamesToFetch.map(uname => fetchUserByUsername(apiClient, uname));
            const results = await Promise.allSettled(invitorPromises);
            const newInvitorDetails: Record<string, UserType> = {};
            results.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                newInvitorDetails[usernamesToFetch[index]] = result.value;
              } else { 
                console.error(`Failed to load invitor details for ${usernamesToFetch[index]}:`, result.reason);
                setInvitorError(t('commitments.invitations.errorLoadingInvitors', 'Failed to load some invitor details.'));
              }
            });
            setInvitorDetails(prev => ({ ...prev, ...newInvitorDetails }));
          } catch (err) {
              console.error('Error fetching invitor details:', err);
              setInvitorError(t('commitments.invitations.errorLoadingInvitors', 'Failed to load some invitor details.'));
          } finally {
              setLoadingInvitors(false); // This loading state is separate from the list loading
          }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setReceivedError(msg || t('commitments.invitations.errorLoadingReceived'));
      setHasMoreReceived(false);
    } finally {
      if (isInitialLoad) setReceivedLoading(false);
      isLoadingMoreReceived.current = false;
    }
  }, [apiClient, username, t]);

  // Fetch Sent Invitations (Modified for Infinite Scroll)
  const loadSentInvitations = useCallback(async (page: number, isInitialLoad: boolean = false) => {
    if (!username || !apiClient || isLoadingMoreSent.current) return;

    if (isInitialLoad) {
      setSentLoading(true);
      setSentInvites([]); // Clear on initial load
      setSentNextPage(1);
      setHasMoreSent(true);
    } else {
      isLoadingMoreSent.current = true;
    }
    setSentError(null);

    try {
      const params = { pageNumber: page, pageSize: ITEMS_PER_PAGE };
      const response = await fetchSentInvitations(apiClient, username, params);

      setSentInvites(prev => isInitialLoad ? response.items : [...prev, ...response.items]);
      setSentNextPage(page + 1);
      setHasMoreSent(response.items.length === ITEMS_PER_PAGE);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSentError(msg || t('commitments.invitations.errorLoadingSent'));
      setHasMoreSent(false); // Stop trying to load more on error
    } finally {
      if (isInitialLoad) setSentLoading(false);
      isLoadingMoreSent.current = false;
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


  // Effects to load initial data
  useEffect(() => {
    if (username && tabValue === 0) {
      // Reset and load initial received invites
      loadReceivedInvitations(1, true);
    }
  }, [username, tabValue, loadReceivedInvitations]); // Only trigger initial on tab change

  useEffect(() => {
    if (username && tabValue === 1) {
      // Reset and load initial sent invites
      loadSentInvitations(1, true);
    }
  }, [username, tabValue, loadSentInvitations]); // Only trigger initial on tab change

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Resetting happens in the useEffects above now
  };

  // Helper to format date (consider moving to a shared util)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // --- Intersection Observers --- 
  const receivedObserver = useRef<IntersectionObserver | null>(null);
  const sentObserver = useRef<IntersectionObserver | null>(null);

  const lastReceivedInviteElementRef = useCallback((node: HTMLElement | null) => {
    if (receivedLoading || isLoadingMoreReceived.current) return;
    if (receivedObserver.current) receivedObserver.current.disconnect();

    receivedObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreReceived) {
        console.log('Received Infinite scroll triggered');
        loadReceivedInvitations(receivedNextPage);
      }
    }, { threshold: 0.8 });

    if (node) receivedObserver.current.observe(node);
  }, [receivedLoading, isLoadingMoreReceived, hasMoreReceived, receivedNextPage, loadReceivedInvitations]);

  const lastSentInviteElementRef = useCallback((node: HTMLElement | null) => {
    if (sentLoading || isLoadingMoreSent.current) return;
    if (sentObserver.current) sentObserver.current.disconnect();

    sentObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreSent) {
        console.log('Sent Infinite scroll triggered');
        loadSentInvitations(sentNextPage);
      }
    }, { threshold: 0.8 });

    if (node) sentObserver.current.observe(node);
  }, [sentLoading, isLoadingMoreSent, hasMoreSent, sentNextPage, loadSentInvitations]);

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
        {/* Initial Loading Skeleton */}
        {receivedLoading && (
          <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
             {/* Provide type for index */} 
            {Array.from(new Array(ITEMS_PER_PAGE)).map((_: unknown, index: number) => (
              <Grid item xs={12} sm={6} md={6} key={`skel-rec-${index}`} sx={{ display: 'flex' }}>
                 {/* Copy the FULL Skeleton structure here from previous step for a single card */}
                 <Paper elevation={0} sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 })}> 
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                     <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                       <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                       <Skeleton variant="text" width="50%" sx={{ fontSize: '0.8rem' }} />
                       <Skeleton variant="text" width="60%" sx={{ fontSize: '0.8rem' }} />
                       <Skeleton variant="text" width="80%" sx={{ fontSize: '0.8rem' }} />
                     </Box>
                     <Stack direction="column" spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                       <Skeleton variant="rounded" width={60} height={22} />
                       <Skeleton variant="rounded" width={70} height={24} />
                     </Stack>
                   </Box>
                   <Box sx={{ mt: 'auto', width: '100%' }}>
                     <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center" justifyContent="flex-end">
                        <Skeleton variant="rounded" height={30} sx={{ flexGrow: 1 }} />
                        <Skeleton variant="rounded" height={30} sx={{ flexGrow: 1 }} />
                     </Stack>
                   </Box>
                 </Paper>
              </Grid>
            ))}
          </Grid>
        )}
        {/* Error Display */}
        {!receivedLoading && receivedError && receivedInvites.length === 0 && (
            <Alert severity="error" sx={{ my: 2 }}>{receivedError}</Alert>
        )}
        {/* Empty State */}
        {!receivedLoading && !receivedError && receivedInvites.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
            {t('commitments.invitations.noReceived', 'No received invitations found.')}
          </Typography>
        )}
        {/* List Rendering */}
        {receivedInvites.length > 0 && (
          <Box>
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
              {receivedInvites.map((invite, index) => {
                  const attachObserver = index === receivedInvites.length - 3;
                  const isLoading = responseLoading[invite.id]; // Needed for buttons
                  const errorMsg = responseError[invite.id]; // Needed for error display
                  const isPending = invite.status.toLowerCase() === 'pending';
                  const invitor = invitorDetails[invite.commitment.creatorUsername];

                  return (
                     <Grid item xs={12} sm={6} md={6} key={invite.id} sx={{ display: 'flex' }} ref={attachObserver ? lastReceivedInviteElementRef : undefined}>
                         <Paper
                             elevation={0}
                             sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 })}
                         >
                           {/* Top section */}
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                             {/* Left: Title, Invitor, Date, Location */}
                             <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                               <AccessibleTypography variant="subtitle1" fontWeight="medium" noWrap title={invite.commitment.title}>{invite.commitment.title}</AccessibleTypography>
                               {/* Invitor Chip */} 
                               <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                                 <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>{t('commitments.invitations.from', 'From')}:</Typography>
                                 {loadingInvitors && !invitor ? (<CircularProgress size={16} sx={{ ml: 1 }} />) : invitor ? (
                                   <Chip component={RouterLink} to={`/people/${invitor.username}`} clickable 
                                     avatar={<Avatar src={invitor.profilePicture || undefined} sx={{ width: 26, height: 26 }}>{!invitor.profilePicture && invitor.username.charAt(0).toUpperCase()}</Avatar>}
                                     label={invitor.displayName || invitor.username} size="small"
                                     sx={(theme) => ({ height: 'auto', maxWidth: 'calc(100% - 50px)', backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary, borderRadius: '16px', '& .MuiChip-avatar': { margin: '1px -2px 1px 3px' }, '& .MuiChip-label': { py: 0.2, px: 0.6, fontSize: '0.75rem' } })} />
                                  ) : (<Typography variant="body2" color="text.secondary">{invite.commitment.creatorUsername}</Typography>)} 
                                </Box>
                               {/* Date/Location */}
                               <AccessibleTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t('common.date')}: {formatDate(invite.commitment.dateTime)}</AccessibleTypography>
                               <AccessibleTypography variant="body2" color="text.secondary" noWrap title={invite.commitment.location.description}>{t('commitments.table.location')}: {invite.commitment.location.description}</AccessibleTypography>
                             </Box>
                             {/* Right: Status Tag, Details Button */}
                             <Stack direction="column" spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                               {/* Status Tag */} 
                               <Box sx={(theme) => { const statusLower = invite.status.toLowerCase(); let statusColor = theme.palette.warning.main; if (statusLower === 'accepted') statusColor = theme.palette.success.main; else if (statusLower === 'rejected') statusColor = theme.palette.error.main; return { display: 'inline-block', px: 1.2, py: 0.4, borderRadius: '16px', backgroundColor: theme.palette.background.paper, border: `1px solid ${statusColor}`, color: statusColor, fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize', whiteSpace: 'nowrap' }; }}>
                                 {t(`commitments.invitations.status.${invite.status.toLowerCase()}`, invite.status)}
                               </Box>
                               {/* Details Button */} 
                               <Button variant="text" size="small" onClick={() => handleViewDetails(invite.commitmentId)} startIcon={<Info size={16} weight="regular" />} sx={{ flexShrink: 0, minWidth: 'auto', lineHeight: 1 }}>{t('common.details', 'Details')}</Button>
                             </Stack>
                           </Box>
                           {/* Bottom section: Action Buttons */}
                           <Box sx={{ mt: 'auto', width: '100%' }}>
                             {isPending && (
                               <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center" justifyContent="flex-end">
                                 <Button variant="contained" size="small" color="success" onClick={() => handleInvitationResponse(invite.id, 'accepted')} disabled={isLoading} sx={{ flexGrow: 1 }}>{isLoading ? <CircularProgress size={20} color="inherit" /> : t('common.accept', 'Accept')}</Button>
                                 <Button variant="outlined" size="small" color="error" onClick={() => handleInvitationResponse(invite.id, 'rejected')} disabled={isLoading} sx={{ flexGrow: 1 }}>{isLoading ? <CircularProgress size={20} color="inherit" /> : t('common.reject', 'Reject')}</Button>
                               </Stack>
                             )}
                             {errorMsg && <Alert severity="error" sx={{ mt: 1, p: '0 8px', fontSize: '0.8rem', width: 'fit-content', ml: 'auto' }}>{errorMsg}</Alert>}
                           </Box>
                         </Paper>
                     </Grid>
                  );
              })}
            </Grid>
            
             {/* Loading More Indicator - Corrected Structure */}
             {isLoadingMoreReceived.current && ( 
                 <Grid container spacing={2} sx={{ width: '100%', m: 0, justifyContent: 'center', mt: 1, py: 3 }}>
                     {/* Show 1 Skeleton Card when loading more */} 
                    <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
                         {/* Single Received Skeleton Card */} 
                         <Paper elevation={0} sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 })}> 
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                             <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                               <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                               <Skeleton variant="text" width="50%" sx={{ fontSize: '0.8rem' }} />
                               <Skeleton variant="text" width="60%" sx={{ fontSize: '0.8rem' }} />
                               <Skeleton variant="text" width="80%" sx={{ fontSize: '0.8rem' }} />
                             </Box>
                             <Stack direction="column" spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                               <Skeleton variant="rounded" width={60} height={22} />
                               <Skeleton variant="rounded" width={70} height={24} />
                             </Stack>
                           </Box>
                           <Box sx={{ mt: 'auto', width: '100%' }}>
                             <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center" justifyContent="flex-end">
                                <Skeleton variant="rounded" height={30} sx={{ flexGrow: 1 }} />
                                <Skeleton variant="rounded" height={30} sx={{ flexGrow: 1 }} />
                             </Stack>
                           </Box>
                         </Paper>
                    </Grid>
                 </Grid>
             )}

             {/* End of Results Message */}
             {!receivedLoading && !hasMoreReceived && receivedInvites.length > 0 && (
                <Box sx={{ textAlign: 'center', p: 3, mt: 1 }}>
                   <Typography color="text.secondary">
                      {t('people.endOfResults', "You've reached the end of the results")} 
                   </Typography>
                </Box>
             )}
          </Box>
        )}
      </TabPanel>

      {/* Sent Invitations Panel */}
      <TabPanel value={tabValue} index={1}>
         {/* Initial Loading Skeleton */}
         {sentLoading && (
            <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
                {/* Provide type for index */} 
                {Array.from(new Array(ITEMS_PER_PAGE)).map((_: unknown, index: number) => (
                  <Grid item xs={12} sm={6} md={6} key={`skel-sent-${index}`} sx={{ display: 'flex' }}>
                     {/* Copy the FULL Skeleton structure here for a single sent card */}
                     <Paper elevation={0} sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' })}> 
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                         <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                             <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                             <Skeleton variant="text" width="60%" sx={{ fontSize: '0.8rem' }} />
                             <Skeleton variant="text" width="80%" sx={{ fontSize: '0.8rem' }} />
                         </Box>
                         <Skeleton variant="rounded" width={70} height={24} sx={{ flexShrink: 0 }} />
                       </Box>
                     </Paper>
                  </Grid>
                ))}
            </Grid>
         )}
         {/* Error Display */}
         {!sentLoading && sentError && sentInvites.length === 0 && (
            <Alert severity="error" sx={{ my: 2 }}>{sentError}</Alert>
         )}
         {/* Empty State */} 
         {!sentLoading && !sentError && sentInvites.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
                {t('commitments.invitations.noSent', 'No sent invitations found.')}
            </Typography>
         )}
         {/* List Rendering */}
         {sentInvites.length > 0 && (
            <Box>
                <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
                  {sentInvites.map((invite, index) => {
                      const attachObserver = index === sentInvites.length - 3;
                      return (
                          <Grid item xs={12} sm={6} md={6} key={invite.id} sx={{ display: 'flex' }} ref={attachObserver ? lastSentInviteElementRef : undefined}>
                              <Paper
                                elevation={0}
                                sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' })}
                              >
                                {/* Top part: Details */} 
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                      <AccessibleTypography variant="subtitle1" fontWeight="medium" noWrap title={invite.title}>{invite.title}</AccessibleTypography>
                                      <AccessibleTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t('common.date')}: {formatDate(invite.dateTime)}</AccessibleTypography>
                                      <AccessibleTypography variant="body2" color="text.secondary" noWrap title={invite.location.description}>{t('commitments.table.location')}: {invite.location.description}</AccessibleTypography>
                                  </Box>
                                  {/* Details Button */} 
                                  <Button variant="text" size="small" onClick={() => handleViewDetails(invite.id)} startIcon={<Info size={16} weight="regular" />} sx={{ flexShrink: 0, minWidth: 'auto', p: '4px 8px' }}>{t('common.details', 'Details')}</Button>
                                </Box>
                                {/* Optional: Bottom part */} 
                                {/* <Box sx={{ mt: 'auto' }}>...</Box> */} 
                              </Paper>
                          </Grid>
                      );
                  })}
                </Grid>
                
                {/* Loading More Indicator - Corrected Structure */}
                {isLoadingMoreSent.current && (
                  <Grid container spacing={2} sx={{ width: '100%', m: 0, justifyContent: 'center', mt: 1, py: 3 }}>
                     {/* Show 1 Skeleton Card when loading more */} 
                      <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
                          {/* Single Sent Skeleton Card */} 
                          <Paper elevation={0} sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' })}> 
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                  <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                                  <Skeleton variant="text" width="60%" sx={{ fontSize: '0.8rem' }} />
                                  <Skeleton variant="text" width="80%" sx={{ fontSize: '0.8rem' }} />
                              </Box>
                              <Skeleton variant="rounded" width={70} height={24} sx={{ flexShrink: 0 }} />
                            </Box>
                          </Paper>
                      </Grid>
                  </Grid>
                )}

                {/* End of Results Message */} 
                {!sentLoading && !hasMoreSent && sentInvites.length > 0 && (
                    <Box sx={{ textAlign: 'center', p: 3, mt: 1 }}>
                       <Typography color="text.secondary">
                         {t('people.endOfResults', "You've reached the end of the results")} 
                       </Typography>
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
