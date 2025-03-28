import { PayloadAction } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { User, UserState } from './types';
import { SharedStateSelector } from '../../app/store/store';
export declare const fetchUser: import("@reduxjs/toolkit").AsyncThunk<User, {
    apiClient: AxiosInstance;
}, {
    rejectValue: string;
    state?: unknown;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const userSlice: import("@reduxjs/toolkit").Slice<UserState, {
    clearUser: (state: import("immer").WritableDraft<UserState>) => void;
    setOnboardingStatus: (state: import("immer").WritableDraft<UserState>, action: PayloadAction<boolean>) => void;
}, "user", "user", import("@reduxjs/toolkit").SliceSelectors<UserState>>;
export declare const clearUser: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"user/clearUser">, setOnboardingStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "user/setOnboardingStatus">;
export declare const selectNeedsOnboarding: SharedStateSelector<boolean>;
export declare const selectCurrentUser: SharedStateSelector<User | null>;
export declare const selectUserLoadingStatus: SharedStateSelector<'idle' | 'loading' | 'succeeded' | 'failed'>;
declare const _default: import("redux").Reducer<UserState>;
export default _default;
