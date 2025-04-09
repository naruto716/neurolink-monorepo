// apps/web/src/pages/commitments/components/CommitmentListInfiniteScroll.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  AvatarGroup,
  CircularProgress, // Re-add for submit button
  Alert,
  Typography,
  TextField, // Add back for form
  Tooltip,
  Button,
  Dialog,
  DialogActions, // Add back for modal buttons
  DialogTitle,
  DialogContent,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Grid,
  Skeleton,
  Stack,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // Add back for date picker
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'; // Add back date adapter
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; // Add back date time picker
import AddIcon from '@mui/icons-material/Add'; // Add back for button icon
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '@neurolink/shared/src/features/user/userSlice';
import {
  Commitment,
  PaginatedCommitmentsResponse,
  CreateCommitmentRequest, // Add back
} from '@neurolink/shared';
import {
  fetchUserCommitments,
  createCommitment, // Add back
} from '@neurolink/shared/src/features/user/userAPI';
import { SharedRootState } from '@neurolink/shared/src/app/store/store';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import apiClientInstance from '../../../app/api/apiClient';
import { Info, MapPin } from '@phosphor-icons/react'; // Add back MapPin
import { toast } from 'react-toastify'; // Add back toast
import debounce from 'lodash/debounce'; // Add back debounce
import CommitmentDetail from './CommitmentDetail';

const ITEMS_PER_PAGE = 10; // Adjust page size for infinite scroll if desired

// Note: Using the hardcoded API key found in CommitmentDetail.tsx. Ideally, move this to config.
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

// Initial state for the new commitment form
const initialNewCommitmentState: CreateCommitmentRequest = {
  title: '',
  description: '',
  dateTime: new Date().toISOString(), // Default to now, will be updated by picker
  location: { description: '' },
};

const CommitmentListInfiniteScroll: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apiClient = apiClientInstance;
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Initial loading
  const [error, setError] = useState<string | null>(null);
  const [sortOrder] = useState<'asc' | 'desc'>('desc'); // Removed unused setSortOrder
  const [selectedRole, setSelectedRole] = useState<'all' | 'organizer' | 'participant'>('all');

  // Infinite Scroll State
  const [nextPage, setNextPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const isLoadingMore = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // State for the details modal
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<number | null>(null);

  // State for the create modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newCommitmentData, setNewCommitmentData] = useState<CreateCommitmentRequest>(initialNewCommitmentState);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string>(''); // State for map preview URL

  const username = currentUser?.username;

  // Function to generate Google Maps embed URL
  const generateMapUrl = (location: string): string => {
    if (!location.trim()) {
      return ''; // Return empty if location is empty
    }
    const query = encodeURIComponent(location);
    // Use the same embed URL structure as CommitmentDetail
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${query}`;
  };

  // Debounced function to update the map URL state
  const updateMapUrlDebounced = useCallback(
    debounce((locationDescription: string) => {
      setMapUrl(generateMapUrl(locationDescription));
    }, 500), // Debounce time: 500ms
    [] // Empty dependency array ensures the debounced function is created only once
  );
  const now = new Date();

  // Fetch Commitments (Modified for Infinite Scroll)
  const loadCommitments = useCallback(async (page: number, currentSortOrder: 'asc' | 'desc', currentRole: 'all' | 'organizer' | 'participant', isInitialLoad: boolean = false) => {
    if (!username || !apiClient || isLoadingMore.current) return;

    if (isInitialLoad) {
      setIsLoading(true);
      setCommitments([]); // Clear on initial load or filter/sort change
      setNextPage(1);
      setHasMore(true);
    } else {
      isLoadingMore.current = true;
      // Optionally show a smaller loading indicator at the bottom
    }
    setError(null);

    try {
      const params = {
        pageNumber: page,
        pageSize: ITEMS_PER_PAGE,
        sortOrder: currentSortOrder,
        ...(currentRole !== 'all' && { role: currentRole }),
      };
      const response: PaginatedCommitmentsResponse = await fetchUserCommitments(
        apiClient,
        username,
        params
      );

      setCommitments(prev => isInitialLoad ? response.items : [...prev, ...response.items]);
      setNextPage(page + 1);
      setHasMore(response.items.length === ITEMS_PER_PAGE);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || t('commitments.errorLoading'));
      setHasMore(false); // Stop loading on error
    } finally {
      if (isInitialLoad) setIsLoading(false);
      isLoadingMore.current = false;
    }
  }, [apiClient, username, t]); // Removed commitments from dependencies

  // Effect for initial load and when filters/sort change
  useEffect(() => {
    if (username) {
      loadCommitments(1, sortOrder, selectedRole, true);
    }
    // Intentionally disabling exhaustive-deps, loadCommitments is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, sortOrder, selectedRole]); // Trigger initial load on filter/sort change

  // Intersection Observer Callback
  const lastCommitmentElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading || isLoadingMore.current) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        console.log('Infinite scroll triggered for commitments');
        loadCommitments(nextPage, sortOrder, selectedRole);
      }
    }, { threshold: 0.8 }); // Adjust threshold as needed

    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, nextPage, sortOrder, selectedRole, loadCommitments]);

  // Remove unused sort handler for now
  // const handleSortChange = () => {
  //   const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  //   setSortOrder(newSortOrder);
  //   // Initial load will be triggered by useEffect
  // };

  // --- Create Modal Handlers ---
  const handleOpenCreateModal = () => {
    setNewCommitmentData(initialNewCommitmentState); // Reset form
    setSelectedDate(new Date()); // Reset date picker
    setSubmitError(null); // Clear previous errors
    setMapUrl(''); // Clear map URL when opening modal
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setCreateModalOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'location') {
      const newDescription = value;
      setNewCommitmentData(prev => ({
        ...prev,
        location: { description: newDescription },
      }));
      // Call the debounced function to update the map preview
      updateMapUrlDebounced(newDescription);
    } else {
      setNewCommitmentData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDateChange = (newValue: Date | null) => {
    setSelectedDate(newValue);
    if (newValue) {
      setNewCommitmentData(prev => ({
        ...prev,
        dateTime: newValue.toISOString(), // Update dateTime in ISO format
      }));
    }
  };

  const handleCreateCommitmentSubmit = async () => {
    if (!apiClient) {
      setSubmitError(t('common.errorApiClient'));
      return;
    }
    if (!newCommitmentData.title || !newCommitmentData.dateTime || !newCommitmentData.location.description) {
        setSubmitError(t('commitments.create.errorRequiredFields'));
        return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createCommitment(apiClient, newCommitmentData);
      toast.success(t('commitments.create.successMessage'));
      handleCloseCreateModal();
      // Refresh the list by triggering initial load
      loadCommitments(1, sortOrder, selectedRole, true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setSubmitError(errorMessage || t('commitments.create.errorMessage'));
      toast.error(errorMessage || t('commitments.create.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Create Modal Handlers ---

  const handleRoleChange = (
    event: React.MouseEvent<HTMLElement>,
    newRole: 'all' | 'organizer' | 'participant' | null,
  ) => {
    if (newRole !== null) {
      setSelectedRole(newRole);
      // Initial load will be triggered by useEffect
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // --- Detail Modal Handlers ---
  const handleViewDetails = (commitmentId: number) => {
    setSelectedCommitmentId(commitmentId);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedCommitmentId(null);
  };
  // --- End Detail Modal Handlers ---

  // --- Skeleton Component ---
  const CommitmentSkeleton = () => (
    <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
        <Paper elevation={0} sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 })}>
            {/* Top section skeleton */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                {/* Left: Title, Date, Location */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Skeleton variant="text" width="70%" sx={{ fontSize: '1rem' }} />
                    <Skeleton variant="text" width="50%" sx={{ fontSize: '0.8rem', mt: 0.5 }} />
                    <Skeleton variant="text" width="60%" sx={{ fontSize: '0.8rem' }} />
                </Box>
                {/* Right: Status, Details Button */}
                <Stack direction="column" spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                    <Skeleton variant="rounded" width={60} height={22} /> {/* Status */}
                    <Skeleton variant="rounded" width={70} height={24} /> {/* Details Button */}
                </Stack>
            </Box>
            {/* Bottom section: Participants */}
            <Box sx={{ mt: 'auto', width: '100%' }}>
                <Skeleton variant="circular" width={28} height={28} sx={{ display: 'inline-block', mr: -1 }} />
                <Skeleton variant="circular" width={28} height={28} sx={{ display: 'inline-block', mr: -1 }} />
                <Skeleton variant="circular" width={28} height={28} sx={{ display: 'inline-block' }} />
            </Box>
        </Paper>
    </Grid>
  );

  return (
    <Box>
      {/* Header and Filters (Similar to CommitmentList, but without pagination controls) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <AccessibleTypography variant="h6" component="h2">
          {t('commitments.yourCommitments')}
        </AccessibleTypography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Role Filter Toggle Buttons - Apply Styling */}
          <ToggleButtonGroup
              value={selectedRole}
              exclusive
              onChange={handleRoleChange}
              aria-label={t('commitments.filter.roleLabel', "Filter by role")}
              size="small"
              sx={{ flexGrow: 1 }} // Add flexGrow to the group
            >
              <ToggleButton
                value="all"
                aria-label={t('commitments.filter.all', "All")}
                sx={{
                  flex: 1,
                  minWidth: '80px', // Restore minWidth
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    color: (theme) => theme.palette.primary.contrastText,
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                  '&:not(.Mui-selected):hover': {
                     backgroundColor: 'action.hover',
                  }
                }}
              >
                {t('commitments.filter.all', "All")}
              </ToggleButton>
              <ToggleButton
                value="organizer"
                aria-label={t('commitments.filter.organizer', "Organizer")}
                sx={{
                  flex: 1,
                  minWidth: '80px', // Restore minWidth
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    color: (theme) => theme.palette.primary.contrastText,
                    backgroundColor: 'primary.main',
                     '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                   '&:not(.Mui-selected):hover': {
                     backgroundColor: 'action.hover',
                  }
                }}
              >
                {t('commitments.filter.organizer', "Organizer")}
              </ToggleButton>
              <ToggleButton
                value="participant"
                aria-label={t('commitments.filter.participant', "Participant")}
                sx={{
                  flex: 1,
                  minWidth: '80px', // Restore minWidth
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: 'divider',
                   '&.Mui-selected': {
                    color: (theme) => theme.palette.primary.contrastText,
                    backgroundColor: 'primary.main',
                     '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                   '&:not(.Mui-selected):hover': {
                     backgroundColor: 'action.hover',
                  }
                }}
              >
                {t('commitments.filter.participant', "Participant")}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Sort Control (Example: Simple Button) */}
            {/* You might want a more sophisticated sort control */}
             {/* Sort Control (Example: Simple Button) */}
             {/* You might want a more sophisticated sort control */}
             {/* <Button onClick={handleSortChange} size="small" variant="outlined">
                Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
             </Button> */}
             {/* Organize Commitment Button */}
             <Button
               variant="contained"
               startIcon={<AddIcon />}
               onClick={handleOpenCreateModal}
               size="small"
               sx={{ textTransform: 'none' }}
             >
               {t('commitments.organizeButton', 'Organize')}
             </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}

      {/* Initial Loading Skeleton */}
      {isLoading && commitments.length === 0 && (
        <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
          {Array.from(new Array(ITEMS_PER_PAGE)).map((_, index) => (
            <CommitmentSkeleton key={`skel-init-${index}`} />
          ))}
        </Grid>
      )}

      {/* List Rendering (Using Grid for card-like layout) */}
      {!isLoading && commitments.length > 0 && (
        <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
          {commitments.map((commitment, index) => {
            const isLastElement = index === commitments.length - 1;
            return (
              <Grid item xs={12} sm={6} md={6} key={commitment.id} sx={{ display: 'flex' }} ref={isLastElement ? lastCommitmentElementRef : undefined}>
                 <Paper elevation={0} sx={(theme) => ({ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 })}>
                    {/* Top section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 1 }}>
                        {/* Left: Title, Date, Location */}
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <AccessibleTypography variant="subtitle1" fontWeight="medium" noWrap title={commitment.title}>{commitment.title}</AccessibleTypography>
                            <AccessibleTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t('common.date')}: {formatDate(commitment.dateTime)}</AccessibleTypography>
                            <AccessibleTypography variant="body2" color="text.secondary" noWrap title={commitment.location.description}>{t('commitments.table.location')}: {commitment.location.description}</AccessibleTypography>
                        </Box>
                        {/* Right: Status, Details Button */}
                        <Stack direction="column" spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                            {/* Status */}
                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                               <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: (theme) => new Date(commitment.dateTime) > now ? theme.palette.success.main : theme.palette.action.disabled, mr: 1 }} />
                               <AccessibleTypography variant="body2" sx={{ color: (theme) => new Date(commitment.dateTime) > now ? theme.palette.success.main : theme.palette.action.disabled, textTransform: 'capitalize' }}>
                                 {new Date(commitment.dateTime) > now ? t('common.upcoming') : t('common.past')}
                               </AccessibleTypography>
                             </Box>
                            {/* Details Button */}
                            <Button variant="text" size="small" onClick={() => handleViewDetails(commitment.id)} startIcon={<Info size={16} weight="regular" />} sx={{ flexShrink: 0, minWidth: 'auto', lineHeight: 1 }}>{t('common.details', 'Details')}</Button>
                        </Stack>
                    </Box>
                    {/* Bottom section: Participants */}
                    <Box sx={{ mt: 'auto', width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                         {commitment.participants && commitment.participants.length > 0 ? (
                           <AvatarGroup max={4} sx={{ '.MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' }, '.MuiAvatarGroup-avatar': { border: '2px solid #2D2D2D', marginLeft: '-8px' } }}>
                             {commitment.participants.map((participant) => (
                               <Tooltip title={participant.displayName} placement="top" key={participant.id}>
                                 <Avatar
                                   alt={participant.displayName}
                                   src={participant.profilePicture || undefined}
                                   sx={{ backgroundColor: participant.profilePicture ? 'transparent' : '#666', cursor: 'pointer' }}
                                   onClick={(e) => { e.stopPropagation(); navigate(`/people/${participant.username}`); }}
                                 />
                               </Tooltip>
                             ))}
                           </AvatarGroup>
                         ) : (
                           <AccessibleTypography variant="caption" color="text.secondary">-</AccessibleTypography>
                         )}
                    </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Loading More Indicator */}
      {isLoadingMore.current && (
        <Grid container spacing={2} sx={{ width: '100%', m: 0, justifyContent: 'center', mt: 1, py: 3 }}>
          {/* Show 1 Skeleton Card when loading more */}
          <CommitmentSkeleton />
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && !error && commitments.length === 0 && (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
          {t('commitments.noCommitmentsFound')}
        </Typography>
      )}

       {/* End of Results Message */}
       {!isLoading && !hasMore && commitments.length > 0 && (
          <Box sx={{ textAlign: 'center', p: 3, mt: 1 }}>
             <Typography color="text.secondary">
                {t('people.endOfResults', "You've reached the end of the results")}
             </Typography>
          </Box>
       )}


      {/* Detail Modal (Reused from CommitmentList) */}
      <Dialog
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        aria-labelledby="commitment-detail-dialog-title"
        maxWidth="md"
        fullWidth
      >
        {selectedCommitmentId && (
          <DialogTitle id="commitment-detail-dialog-title" sx={{ m: 0, p: 2 }}>
            {t('commitments.detail.modalTitle', 'Commitment Details')}
            <IconButton
              aria-label={t('common.close', 'Close')}
              onClick={handleCloseDetailModal}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
        )}
        <DialogContent dividers>
          {selectedCommitmentId && (
            <CommitmentDetail commitmentId={selectedCommitmentId} />
          )}
        </DialogContent>
      </Dialog>

      {/* --- Create Commitment Modal Dialog --- */}
      <Dialog
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        aria-labelledby="create-commitment-dialog-title"
        maxWidth="sm" // Smaller modal for creation form
        fullWidth
      >
        <DialogTitle id="create-commitment-dialog-title">
          {t('commitments.create.modalTitle', 'Organize a New Commitment')}
          <IconButton
            aria-label={t('common.close', 'Close')}
            onClick={handleCloseCreateModal}
            disabled={isSubmitting}
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
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
              <TextField
                margin="dense"
                required
                fullWidth
                id="title"
                label={t('commitments.create.titleLabel', 'Title')}
                name="title"
                value={newCommitmentData.title}
                onChange={handleInputChange}
                disabled={isSubmitting}
                error={!!submitError && !newCommitmentData.title} // Highlight if error and empty
                helperText={!!submitError && !newCommitmentData.title ? t('common.errorRequired') : ''}
              />
              <TextField
                margin="dense"
                fullWidth
                id="description"
                label={t('commitments.create.descriptionLabel', 'Description')}
                name="description"
                multiline
                rows={3}
                value={newCommitmentData.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
               <DateTimePicker
                 label={t('commitments.create.dateTimeLabel', 'Date & Time')}
                 value={selectedDate}
                 onChange={handleDateChange}
                 ampm={false} // Use 24-hour format for clarity
                 disabled={isSubmitting}
                 sx={{ width: '100%', mt: 2, mb: 1 }}
               />
              <TextField
                margin="normal" // Adjusted margin for spacing
                required
                fullWidth
                id="location"
                label={t('commitments.create.locationLabel', 'Location')}
                name="location"
                value={newCommitmentData.location.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                error={!!submitError && !newCommitmentData.location.description}
                helperText={!!submitError && !newCommitmentData.location.description ? t('common.errorRequired') : t('commitments.create.locationHelp', 'Enter address or place name. Map will preview below.')}
              />

              {/* Map Preview Section */}
              {newCommitmentData.location.description && ( // Only show if location has text
                <Box sx={{ mt: 2 }}>
                   <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                     <MapPin size={18} weight="regular" style={{ marginRight: 8, color: 'text.secondary' }} />
                     <AccessibleTypography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                       {t('commitments.create.mapPreviewLabel', 'Map Preview')}
                     </AccessibleTypography>
                   </Box>
                  {mapUrl ? (
                    <Box
                      sx={{
                        mt: 1,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: theme => `1px solid ${theme.palette.divider}`,
                        minHeight: '250px', // Ensure space even while loading
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <iframe
                        src={mapUrl}
                        title="Location Map Preview"
                        width="100%"
                        height="250px" // Fixed height for preview
                        style={{ border: 'none' }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        aria-label="Google Map preview for entered location"
                      />
                    </Box>
                  ) : (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                       <CircularProgress size={24} />
                     </Box>
                  )}
                </Box>
              )}
              {/* End Map Preview Section */}

              {submitError && (
                <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>
              )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px', borderTop: theme => `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleCloseCreateModal} disabled={isSubmitting} color="inherit">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleCreateCommitmentSubmit}
            variant="contained"
            disabled={isSubmitting || !newCommitmentData.title || !selectedDate || !newCommitmentData.location.description} // Basic validation for button state
          >
            {isSubmitting ? <CircularProgress size={24} /> : t('common.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- End Create Commitment Modal Dialog --- */}
      {/* Remove extra closing Dialog tag */}

    </Box> // This closes the Box from line 316
  );
};

export default CommitmentListInfiniteScroll;