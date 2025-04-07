import { SharedStateSelector } from '../../app/store/store';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
export interface ChatState {
    connectionStatus: ConnectionStatus;
    userId: string | null;
    totalUnreadCount: number;
    error: string | null;
}
export declare const setChatConnecting: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"chat/setChatConnecting">, setChatConnected: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userId: string;
}, "chat/setChatConnected">, setChatDisconnected: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<{
    error?: string;
} | undefined, "chat/setChatDisconnected">, setChatError: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    error: string;
}, "chat/setChatError">, setTotalUnreadCount: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "chat/setTotalUnreadCount">;
declare const _default: import("redux").Reducer<ChatState>;
export default _default;
export declare const selectChatConnectionStatus: SharedStateSelector<ConnectionStatus>;
export declare const selectTotalUnreadCount: SharedStateSelector<number>;
export declare const selectChatUserId: SharedStateSelector<string | null>;
export declare const selectChatError: SharedStateSelector<string | null>;
