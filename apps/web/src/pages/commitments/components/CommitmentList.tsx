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
  Tooltip,
  Button,
  Dialog, // Import Dialog components
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '@neurolink/shared/src/features/user/userSlice';
// Commitment type is needed here, PaginatedCommitmentsResponse might not be if we only use items
import { Commitment, PaginatedCommitmentsResponse } from '@neurolink/shared';
import { fetchUserCommitments } from '@neurolink/shared/src/features/user/userAPI';
import { SharedRootState } from '@neurolink/shared/src/app/store/store';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import apiClientInstance from '../../../app/api/apiClient';
import { Info } from '@phosphor-icons/react';
import CommitmentDetail from './CommitmentDetail'; // Import the detail component

const ITEMS_PER_PAGE = 5;

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

  // State for the modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<number | null>(null);

  const fetchCommitments = useCallback(async (currentPage: number, currentSortOrder: 'asc' | 'desc') => {
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
  }, [apiClient, currentUser?.username, t]);

  const usernameForEffect = currentUser?.username;

  useEffect(() => {
    if (usernameForEffect) {
      fetchCommitments(page, sortOrder);
    }
  }, [page, usernameForEffect, sortOrder, fetchCommitments]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSortChange = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const now = new Date();

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

  return (
    <Box>
      <AccessibleTypography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {t('commitments.yourCommitments')}
      </AccessibleTypography>

      {/* Loading/Error/Empty States remain the same */}
      {isLoading && (
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
            {/* Placeholder Title - We might fetch the real title inside CommitmentDetail */}
            {t('breadcrumbs.commitmentDetail', 'Commitment Detail')}
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
        {/* Optional: Add DialogActions if needed */}
        {/* <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions> */}
      </Dialog>
      {/* --- End Modal Dialog --- */}

    </Box>
  );
};

export default CommitmentList;
