// apps/web/src/pages/commitments/components/CommitmentList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Keep for participant navigation
import {
  Box,
  Avatar,
  AvatarGroup,
  Pagination,
  CircularProgress,
  Alert,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TextField, // Added for form
  Tooltip,
  Button,
  Dialog,
  DialogActions, // Added for modal buttons
  DialogTitle,
  DialogContent,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // Added for date picker
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'; // Added date adapter
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; // Added date time picker
import AddIcon from '@mui/icons-material/Add'; // Added for button icon
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '@neurolink/shared/src/features/user/userSlice';
import {
  Commitment,
  PaginatedCommitmentsResponse,
  CreateCommitmentRequest, // Added
} from '@neurolink/shared'; // Adjusted import
import {
  fetchUserCommitments,
  createCommitment, // Added
} from '@neurolink/shared/src/features/user/userAPI';
import { SharedRootState } from '@neurolink/shared/src/app/store/store';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import apiClientInstance from '../../../app/api/apiClient';
import { Info, MapPin } from '@phosphor-icons/react'; // Added MapPin
import CommitmentDetail from './CommitmentDetail';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce'; // Added for map preview debouncing

const ITEMS_PER_PAGE = 5;
// Note: Using the hardcoded API key found in CommitmentDetail.tsx. Ideally, move this to config.
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'; 

// Initial state for the new commitment form
const initialNewCommitmentState: CreateCommitmentRequest = {
  title: '',
  description: '',
  dateTime: new Date().toISOString(), // Default to now, will be updated by picker
  location: { description: '' },
};

const CommitmentList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // Keep for navigating to participant profiles
  const apiClient = apiClientInstance;
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRole, setSelectedRole] = useState<'all' | 'organizer' | 'participant'>('all'); // State for role filter

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

  // Update fetchCommitments to accept and use the role filter
  const fetchCommitments = useCallback(async (
    currentPage: number,
    currentSortOrder: 'asc' | 'desc',
    currentRole: 'all' | 'organizer' | 'participant'
  ) => {
    const username = currentUser?.username;
    if (!username || !apiClient) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: ITEMS_PER_PAGE,
        sortOrder: currentSortOrder,
        // Conditionally add role if it's not 'all'
        ...(currentRole !== 'all' && { role: currentRole }), 
      };
      const response: PaginatedCommitmentsResponse = await fetchUserCommitments(
        apiClient,
        username,
        params
      );
      setCommitments(response.items);
      setTotalPages(response.totalPages);
      setPage(response.pageNumber);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || t('commitments.errorLoading'));
      setCommitments([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  // Add currentRole to dependencies
  }, [apiClient, currentUser?.username, t]); 

  const usernameForEffect = currentUser?.username;

  // Update useEffect to include selectedRole and reset page on role change
  useEffect(() => {
    if (usernameForEffect) {
      // Fetch with current page, sort order, and selected role
      fetchCommitments(page, sortOrder, selectedRole); 
    }
  // Add selectedRole to dependency array
  }, [page, usernameForEffect, sortOrder, selectedRole, fetchCommitments]); 

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSortChange = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setPage(1); // Reset page when sorting changes
  };

  // Handler for role filter change
  const handleRoleChange = (
    event: React.MouseEvent<HTMLElement>,
    newRole: 'all' | 'organizer' | 'participant' | null, // Can be null if nothing is selected
  ) => {
    if (newRole !== null) { // Ensure a value is selected
      setSelectedRole(newRole);
      setPage(1); // Reset page when filter changes
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const now = new Date();

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
      // Refresh the list by calling fetchCommitments with current settings
      fetchCommitments(page, sortOrder, selectedRole);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setSubmitError(errorMessage || t('commitments.create.errorMessage'));
      toast.error(errorMessage || t('commitments.create.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Create Modal Handlers ---


  return (
    <Box>
      {/* Header, Filter, and Create Button Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <AccessibleTypography variant="h6" component="h2">
          {t('commitments.yourCommitments')}
        </AccessibleTypography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Role Filter Toggle Buttons */}
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
      {/* Loading/Error/Empty States */}
      {isLoading && !isSubmitting && ( // Don't show main loading during submit
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}
      {!isLoading && !error && commitments.length === 0 && (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
          {t('commitments.noCommitmentsFound')}
        </Typography>
      )}

      {/* Table remains the same, except the onClick handler for the details button */}
      {!isLoading && !error && commitments.length > 0 && (
        <TableContainer sx={{ borderRadius: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="commitments table">
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  color: 'text.secondary',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '18px',
                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  py: 1,
                  px: 2,
                  maxWidth: 250,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              <TableRow>
                <TableCell>{t('commitments.table.title')}</TableCell>
                <TableCell align="left" sortDirection={sortOrder}>
                  <TableSortLabel
                    active={true}
                    direction={sortOrder}
                    onClick={handleSortChange}
                  >
                    {t('commitments.table.date')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">{t('commitments.table.location')}</TableCell>
                <TableCell align="left">{t('commitments.table.status')}</TableCell>
                <TableCell>{t('commitments.table.participants')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{
              '& .MuiTableCell-root': {
                borderBottom: 'none',
                py: 1.5,
                px: 2,
                maxWidth: 250,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}>
              {commitments.map((commitment) => (
                <TableRow
                  key={commitment.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {/* Title */}
                  <TableCell component="th" scope="row">
                    <Tooltip title={commitment.title} placement="top">
                      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <AccessibleTypography
                          variant="body2"
                          fontWeight="medium"
                          color="text.primary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {commitment.title}
                        </AccessibleTypography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  {/* Date */}
                  <TableCell align="left">
                    <AccessibleTypography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {formatDate(commitment.dateTime)}
                    </AccessibleTypography>
                  </TableCell>
                  {/* Location */}
                  <TableCell align="left">
                    <Tooltip title={commitment.location.description} placement="top">
                      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <AccessibleTypography
                          variant="body2"
                          color="text.secondary"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {commitment.location.description}
                        </AccessibleTypography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  {/* Status */}
                  <TableCell align="left">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: (theme) => new Date(commitment.dateTime) > now
                            ? theme.palette.success.main
                            : theme.palette.action.disabled,
                          mr: 1,
                        }}
                      />
                      <AccessibleTypography
                        variant="body2"
                        sx={{
                          color: (theme) => new Date(commitment.dateTime) > now
                            ? theme.palette.success.main
                            : theme.palette.action.disabled,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {new Date(commitment.dateTime) > now ? t('common.upcoming') : t('common.past')}
                      </AccessibleTypography>
                    </Box>
                  </TableCell>
                  {/* Participants & Details Button */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        {commitment.participants && commitment.participants.length > 0 ? (
                          <AvatarGroup
                            max={3}
                            sx={{
                              '.MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem', backgroundColor: '#666', color: '#fff' },
                              '.MuiAvatarGroup-avatar': { border: '2px solid #2D2D2D', marginLeft: '-8px', '&:first-of-type': { marginLeft: 0 } }
                            }}
                          >
                            {commitment.participants.map((participant) => (
                              <Tooltip title={participant.displayName} placement="top" key={participant.id}>
                                <Avatar
                                  alt={participant.displayName}
                                  src={participant.profilePicture || undefined}
                                  sx={{ backgroundColor: participant.profilePicture ? 'transparent' : '#666', cursor: 'pointer' }}
                                  onClick={() => navigate(`/people/${participant.username}`)} // Keep navigation for participants
                                />
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <AccessibleTypography variant="body2" color="text.secondary">-</AccessibleTypography>
                        )}
                      </Box>
                      {/* MODIFIED: Button now opens modal */}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleViewDetails(commitment.id)} // Call modal handler
                        startIcon={<Info size={16} weight="regular" />}
                        sx={{ flexShrink: 0, minWidth: 'auto', ml: 1 }}
                      >
                        {t('common.details', 'Details')}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination Controls */}
      {!isLoading && !error && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* --- Detail Modal Dialog --- */}
      <Dialog
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        aria-labelledby="commitment-detail-dialog-title"
        maxWidth="md"
        fullWidth
      >
        {selectedCommitmentId && (
          <DialogTitle id="commitment-detail-dialog-title" sx={{ m: 0, p: 2 }}>
            {t('breadcrumbs.commitmentDetail', 'Commitment Detail')}
            <IconButton
              aria-label={t('common.close', 'Close')}
              onClick={handleCloseDetailModal}
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
          {selectedCommitmentId && (
            <CommitmentDetail commitmentId={selectedCommitmentId} />
          )}
        </DialogContent>
      </Dialog>
      {/* --- End Detail Modal Dialog --- */}

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

    </Box>
  );
};

export default CommitmentList;
