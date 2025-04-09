// apps/web/src/pages/commitments/components/CommitmentList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar, // Re-add Avatar import
  AvatarGroup, // Import AvatarGroup
  Pagination,
  CircularProgress,
  Alert,
  Typography,
  TableContainer, // Import Table components
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel, // Import TableSortLabel
  Tooltip,
  Button,
  // Paper, // Removed unused import
} from '@mui/material';
// Import icons if needed for custom sort indicator
// import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
// Import types and API function from their specific modules within the shared package
import { selectCurrentUser } from '@neurolink/shared/src/features/user/userSlice';
import { Commitment, PaginatedCommitmentsResponse } from '@neurolink/shared/src/features/user/types';
import { fetchUserCommitments } from '@neurolink/shared/src/features/user/userAPI';
import { SharedRootState } from '@neurolink/shared/src/app/store/store';
import { AccessibleTypography } from '../../../app/components/AccessibleTypography';
import apiClientInstance from '../../../app/api/apiClient'; // Import the default instance
import { Info } from '@phosphor-icons/react'; // Change to Info icon

const ITEMS_PER_PAGE = 5; // Or adjust as needed

const CommitmentList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apiClient = apiClientInstance; // Use the imported instance directly
  const currentUser = useSelector((state: SharedRootState) => selectCurrentUser(state));

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Add state for sorting, default 'desc'

  // Update fetchCommitments to accept sortOrder
  const fetchCommitments = useCallback(async (currentPage: number, currentSortOrder: 'asc' | 'desc') => {
    const username = currentUser?.username;
    if (!username || !apiClient) {
      console.log('Skipping fetch: No username or apiClient');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: ITEMS_PER_PAGE,
        sortOrder: currentSortOrder, // Pass sortOrder to params
        // role: 'creator' // Example: Add role filter if needed
      };
      // Log the exact URL and params just before the call
      const requestUrl = `${apiClient.defaults.baseURL}${'/Commitment/users'}/${username}`; // Construct expected URL for logging
      console.log(`Fetching commitments: URL=${requestUrl}, Params=`, params);

      const response: PaginatedCommitmentsResponse = await fetchUserCommitments(
        apiClient,
        username,
        params
      );
      setCommitments(response.items);
      setTotalPages(response.totalPages);
      setPage(response.pageNumber); // Ensure page state matches response
    } catch (err: unknown) { // Use unknown instead of any
      // Type assertion or check needed for err.message
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || t('commitments.errorLoading'));
      setCommitments([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
    // Depend only on stable primitives/instances known to be stable
  // Add sortOrder to dependency array if it's used directly inside, but it's passed as arg now
  }, [apiClient, currentUser?.username, t]);

  // Extract username *outside* useEffect to stabilize dependency
  const usernameForEffect = currentUser?.username;

  useEffect(() => {
    // Only fetch if we have a username
    if (usernameForEffect) {
      console.log(`CommitmentList useEffect triggered: page=${page}, username=${usernameForEffect}`);
      fetchCommitments(page, sortOrder); // Pass current sortOrder
    } else {
      console.log('CommitmentList useEffect skipped: no username');
    }
  // Add sortOrder to dependency array
  }, [page, usernameForEffect, sortOrder, fetchCommitments]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value); // Update page state, useEffect will trigger refetch
  };

  // Handler for changing sort order
  const handleSortChange = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    // Reset to page 1 when sort order changes
    setPage(1);
    // Fetching will be triggered by useEffect due to sortOrder change
  };

  const formatDate = (dateString: string) => {
    // Format date only, similar to design image
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const now = new Date(); // For status chip logic

  // Add handler for viewing commitment details
  const handleViewDetails = (commitmentId: number) => {
    navigate(`/commitments/${commitmentId.toString()}`);
  };

  return (
    <Box>
      <AccessibleTypography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {t('commitments.yourCommitments')}
      </AccessibleTypography>

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

      {!isLoading && !error && commitments.length > 0 && (
        // Use TableContainer without Paper component and remove border/background styles
        <TableContainer sx={{ borderRadius: 2 /* Keep radius if desired, or remove */ }}>
          <Table sx={{ minWidth: 650 }} aria-label="commitments table">
            {/* Apply specific header styles */}
            <TableHead
              sx={{
                '& .MuiTableCell-root': {
                  color: 'text.secondary', // Use theme color (maps to rgba(28, 28, 28, 0.40) in light mode)
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px', // --Font-size-12
                  fontStyle: 'normal',
                  fontWeight: 400, // --Font-weight-Regular
                  lineHeight: '18px', // --Line-height-18
                  letterSpacing: '0px',
                  fontFeatureSettings: "'ss01' on, 'cv01' on",
                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`, // Ensure divider below header
                  py: 1, // Adjust vertical padding
                  px: 2, // Adjust horizontal padding
                  maxWidth: 250, // Add max width for headers
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              <TableRow>
                {/* Reordered Headers: Organizer first */}
                {/* Change header to Participants */}
                {/* Swapped back: Title first */}
                <TableCell>{t('commitments.table.title')}</TableCell>
                {/* Make Date header clickable for sorting */}
                {/* Make Date header clickable for sorting */}
                <TableCell align="left" sortDirection={sortOrder}>
                  <TableSortLabel
                    active={true} // Indicate this column is active for sorting
                    direction={sortOrder}
                    onClick={handleSortChange}
                  >
                    {t('commitments.table.date')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">{t('commitments.table.location')}</TableCell>
                {/* Align status header left */}
                <TableCell align="left">{t('commitments.table.status')}</TableCell>
                <TableCell>{t('commitments.table.participants')}</TableCell>

              </TableRow>
            </TableHead>
            {/* Adjust body cell padding and ensure border */}
            {/* Remove bottom border from body cells */}
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
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }} // Remove border for last row
                >
                  {/* Title Cell */}
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
                  {/* Date Cell */}
                  <TableCell align="left">
                    <AccessibleTypography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {formatDate(commitment.dateTime)}
                    </AccessibleTypography>
                  </TableCell>
                  {/* Location Cell */}
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
                  {/* Status Cell */}
                  <TableCell align="left">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: (theme) => new Date(commitment.dateTime) > now
                            ? theme.palette.success.main // Green for upcoming
                            : theme.palette.action.disabled, // Grey for past (adjust if needed)
                          mr: 1, // Margin right for spacing
                        }}
                      />
                      {/* Match text color to dot color */}
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
                  {/* Participants Cell using AvatarGroup */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Check if participants exist and render AvatarGroup */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        {commitment.participants && commitment.participants.length > 0 ? (
                          <AvatarGroup
                            max={3} // Show max 3 avatars, rest become +X
                            sx={{
                              '.MuiAvatar-root': {
                                width: 28,
                                height: 28,
                                fontSize: '0.75rem',
                                backgroundColor: '#666',
                                color: '#fff'
                              },
                              '.MuiAvatarGroup-avatar': {
                                border: '2px solid #2D2D2D',
                                marginLeft: '-8px',
                                '&:first-of-type': {
                                  marginLeft: 0
                                }
                              }
                            }}
                          >
                            {commitment.participants.map((participant) => (
                              <Tooltip title={participant.displayName} placement="top" key={participant.id}>
                                <Avatar
                                  alt={participant.displayName}
                                  src={participant.profilePicture || undefined}
                                  sx={{ 
                                    backgroundColor: participant.profilePicture ? 'transparent' : '#666',
                                    cursor: 'pointer' 
                                  }}
                                  onClick={() => navigate(`/people/${participant.username}`)}
                                />
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          // Fallback if no participants array (optional)
                          <AccessibleTypography variant="body2" color="text.secondary">
                            -
                          </AccessibleTypography>
                        )}
                      </Box>
                      
                      {/* Details Button */}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleViewDetails(commitment.id)}
                        startIcon={<Info size={16} weight="regular" />}
                        sx={{ 
                          flexShrink: 0,
                          minWidth: 'auto',
                          ml: 1
                        }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}> {/* Increased margin top */}
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default CommitmentList;