import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
// Use the correct ListedUser type and import Tag
import { ListedUser, PaginatedUsersResponse } from './types';
import { fetchUsers, FetchUsersParams } from './userAPI';
import { SharedRootState } from '../../app/store/store';

// Define the state structure for paginated users
export interface PaginatedUsersState {
  users: ListedUser[]; // Use ListedUser[] here
  currentPage: number;
  totalPages: number; // Calculate this based on totalUsers and pageSize
  totalCount: number; // Use totalUsers from API response
  pageSize: number;
  currentFilters: Omit<FetchUsersParams, 'page' | 'limit'>; // This type will be updated by FetchUsersParams change
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: PaginatedUsersState = {
  users: [],
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  pageSize: 10,
  currentFilters: {}, // Initial filters are empty
  status: 'idle',
  error: null,
};

// Define parameters for the async thunk (FetchUsersParams is defined in userAPI.ts, needs update there too)
interface FetchPaginatedUsersArgs extends FetchUsersParams {
  apiClient: AxiosInstance;
}

// Async thunk to fetch paginated users
export const fetchPaginatedUsers = createAsyncThunk<
  PaginatedUsersResponse, 
  FetchPaginatedUsersArgs, 
  { rejectValue: string }
>(
  'paginatedUsers/fetchUsers', 
  async ({ apiClient, ...params }, { rejectWithValue }) => { 
    try {
      const response = await fetchUsers(apiClient, params);
      return response; 
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

// Create the paginated users slice
export const paginatedUsersSlice = createSlice({
  name: 'paginatedUsers', 
  initialState,
  reducers: {
    clearPaginatedUsers: (state) => {
        state.users = [];
        state.currentPage = 1;
        state.totalPages = 0;
        state.totalCount = 0;
        state.currentFilters = {}; // Reset filters
        state.status = 'idle';
        state.error = null;
    },
    // Ensure payload matches the structure expected by FetchUsersParams (excluding page/limit)
    setUsersFilters: (state, action: PayloadAction<Omit<FetchUsersParams, 'page' | 'limit'>>) => {
        state.currentFilters = action.payload;
        state.currentPage = 1;
        state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedUsers.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        // Store the filters used for this request, matching FetchUsersParams structure
        state.currentFilters = {
            q: action.meta.arg.q,
            minAge: action.meta.arg.minAge,
            maxAge: action.meta.arg.maxAge,
            tagTypes: action.meta.arg.tagTypes,
            tagValues: action.meta.arg.tagValues,
            // Removed incorrect 'tags' property
        };
        state.pageSize = action.meta.arg.limit || 10;
      })
      .addCase(fetchPaginatedUsers.fulfilled, (state, action: PayloadAction<PaginatedUsersResponse>) => {
        state.status = 'succeeded';
        // Use the correct property names from the API response
        state.users = action.payload.users; // Use 'users'
        state.currentPage = action.payload.page; // Use 'page'
        state.totalCount = action.payload.totalUsers; // Use 'totalUsers'
        state.pageSize = action.payload.limit; // Use 'limit'
        // Calculate totalPages based on totalUsers and limit
        state.totalPages = Math.ceil(action.payload.totalUsers / action.payload.limit); 
        state.error = null;
      })
      .addCase(fetchPaginatedUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error fetching users';
      });
  }
});

// Export actions and reducer
export const { clearPaginatedUsers, setUsersFilters } = paginatedUsersSlice.actions;

// Selectors - Explicitly use SharedRootState
// Update selector to return ListedUser[]
export const selectPaginatedUsers = (state: SharedRootState): ListedUser[] => 
  state.paginatedUsers?.users || [];

export const selectPaginatedUsersStatus = (state: SharedRootState): PaginatedUsersState['status'] => 
  state.paginatedUsers?.status || 'idle';

export const selectPaginatedUsersError = (state: SharedRootState): string | null => 
  state.paginatedUsers?.error || null;

export const selectUsersCurrentPage = (state: SharedRootState): number => 
  state.paginatedUsers?.currentPage || 1;

export const selectUsersTotalPages = (state: SharedRootState): number => 
  state.paginatedUsers?.totalPages || 0;
  
export const selectUsersTotalCount = (state: SharedRootState): number => 
  state.paginatedUsers?.totalCount || 0;

export const selectUsersPageSize = (state: SharedRootState): number => 
  state.paginatedUsers?.pageSize || 10;

export const selectUsersCurrentFilters = (state: SharedRootState): Omit<FetchUsersParams, 'page' | 'limit'> =>
  state.paginatedUsers?.currentFilters || {};


export default paginatedUsersSlice.reducer;
