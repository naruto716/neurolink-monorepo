import { PayloadAction } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { ListedUser, PaginatedUsersResponse } from './types';
import { FetchUsersParams } from './userAPI';
export interface PaginatedUsersState {
    users: ListedUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    currentFilters: Omit<FetchUsersParams, 'page' | 'limit'>;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}
interface FetchPaginatedUsersArgs extends FetchUsersParams {
    apiClient: AxiosInstance;
}
export declare const fetchPaginatedUsers: import("@reduxjs/toolkit").AsyncThunk<PaginatedUsersResponse, FetchPaginatedUsersArgs, {
    rejectValue: string;
    state?: unknown;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const paginatedUsersSlice: import("@reduxjs/toolkit").Slice<PaginatedUsersState, {
    clearPaginatedUsers: (state: import("immer").WritableDraft<PaginatedUsersState>) => void;
    setUsersFilters: (state: import("immer").WritableDraft<PaginatedUsersState>, action: PayloadAction<Omit<FetchUsersParams, "page" | "limit">>) => void;
}, "paginatedUsers", "paginatedUsers", import("@reduxjs/toolkit").SliceSelectors<PaginatedUsersState>>;
export declare const clearPaginatedUsers: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"paginatedUsers/clearPaginatedUsers">, setUsersFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<FetchUsersParams, "page" | "limit">, "paginatedUsers/setUsersFilters">;
interface StateWithPaginatedUsers {
    paginatedUsers: PaginatedUsersState;
}
export declare const selectPaginatedUsers: (state: StateWithPaginatedUsers) => ListedUser[];
export declare const selectPaginatedUsersStatus: (state: StateWithPaginatedUsers) => PaginatedUsersState["status"];
export declare const selectPaginatedUsersError: (state: StateWithPaginatedUsers) => string | null;
export declare const selectUsersCurrentPage: (state: StateWithPaginatedUsers) => number;
export declare const selectUsersTotalPages: (state: StateWithPaginatedUsers) => number;
export declare const selectUsersTotalCount: (state: StateWithPaginatedUsers) => number;
export declare const selectUsersPageSize: (state: StateWithPaginatedUsers) => number;
export declare const selectUsersCurrentFilters: (state: StateWithPaginatedUsers) => Omit<FetchUsersParams, "page" | "limit">;
declare const _default: import("redux").Reducer<PaginatedUsersState>;
export default _default;
