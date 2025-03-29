import React, { useEffect, useState } from 'react';
// Added Avatar, removed unused Typography, Link
import { Box, Container, Grid, Paper, CircularProgress, Alert, Pagination, TextField, Button, Avatar } from '@mui/material'; 
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../app/store/initStore'; // Removed RootState import
import apiClient from '../../app/api/apiClient';
import { 
  fetchPaginatedUsers, 
  selectPaginatedUsers, 
  selectPaginatedUsersStatus, 
  selectPaginatedUsersError,
  selectUsersCurrentPage,
  selectUsersTotalPages,
  setUsersFilters, 
  clearPaginatedUsers 
} from '@neurolink/shared/src/features/user/paginatedUsersSlice';
// Use ListedUser type here, remove SharedRootState import
import { ListedUser } from '@neurolink/shared'; 
import { AccessibleTypography } from '../../app/components/AccessibleTypography';
import Breadcrumb from '../../app/components/Breadcrumb';

// Placeholder UserCard component - now uses ListedUser
const UserCard: React.FC<{ user: ListedUser }> = ({ user }) => (
    <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={user.profilePicture || undefined} />
        <Box>
            <AccessibleTypography fontWeight="bold">{user.displayName}</AccessibleTypography>
            {/* Removed user.title as it's not in the ListedUser type based on API example */}
        </Box>
        <Button variant="outlined" size="small" sx={{ ml: 'auto' }}>Connect</Button>
    </Paper>
);


const PeoplePage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Selectors - No casting needed
  const users = useAppSelector(selectPaginatedUsers);
  const status = useAppSelector(selectPaginatedUsersStatus);
  const error = useAppSelector(selectPaginatedUsersError);
  const currentPage = useAppSelector(selectUsersCurrentPage);
  const totalPages = useAppSelector(selectUsersTotalPages);

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users when page or filters change
  useEffect(() => {
    // Fetch only if status is idle to avoid re-fetching during loading/success/fail
    // Or refetch if relevant filters/page change (add dependencies as needed)
    if (status === 'idle') {
        dispatch(fetchPaginatedUsers({ apiClient, page: currentPage, q: searchQuery || undefined })); 
    }
  }, [dispatch, currentPage, searchQuery, status]); // Added status to dependency array

  // Clear state on unmount
  useEffect(() => {
    return () => {
      dispatch(clearPaginatedUsers());
    };
  }, [dispatch]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    // Fetch new page with current search query
    dispatch(fetchPaginatedUsers({ apiClient, page: value, q: searchQuery || undefined }));
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = () => {
      // Update filters in state and fetch page 1 with the new query
      dispatch(setUsersFilters({ q: searchQuery || undefined })); 
      dispatch(fetchPaginatedUsers({ apiClient, page: 1, q: searchQuery || undefined })); 
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: t('nav.home'), path: '/' },
    { label: t('people.title', 'People'), path: '/people' } 
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumb customItems={breadcrumbItems} />
      </Box>

      <AccessibleTypography variant="h4" component="h1" gutterBottom>
        {t('people.header', 'Find People')} 
      </AccessibleTypography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
          <TextField 
              label={t('people.searchLabel', 'Search by name, skill, interest...')} 
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" onClick={handleSearchSubmit}>
              {t('people.searchButton', 'Search')} 
          </Button>
          {/* Add more filter controls here */}
      </Paper>

      {/* User List Section */}
      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {status === 'failed' && (
        <Alert severity="error" sx={{ mb: 2 }}>{error || t('people.errorLoading', 'Failed to load people.')}</Alert> 
      )}
      {/* Display users only on success */}
      {status === 'succeeded' && ( 
        <>
          {users.length > 0 ? (
            <Grid container spacing={2}>
              {users.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  {/* Pass ListedUser to UserCard */}
                  <UserCard user={user} /> 
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', p: 5 }}>
              <AccessibleTypography color="text.secondary">
                {t('people.noResults', 'No people found matching your criteria.')} 
              </AccessibleTypography>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PeoplePage;
