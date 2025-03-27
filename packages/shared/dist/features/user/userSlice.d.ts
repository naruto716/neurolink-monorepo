import { PayloadAction } from '@reduxjs/toolkit';
import { User, UserState } from './types';
import { RootState } from '../../app/store/store';
export declare const fetchUser: import("@reduxjs/toolkit").AsyncThunk<User, void, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
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
export declare const selectNeedsOnboarding: (state: RootState) => boolean;
export declare const selectCurrentUser: (state: RootState) => User | null;
export declare const selectUserLoadingStatus: (state: RootState) => "failed" | "succeeded" | "idle" | "loading";
declare const _default: import("redux").Reducer<UserState>;
export default _default;
