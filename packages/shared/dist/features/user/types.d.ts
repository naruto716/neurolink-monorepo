export interface Tag {
    type: string;
    value: string;
}
export interface UserPreferences {
    visibility: string;
    accessibility: {
        colorScheme: string;
        highContrastMode: boolean;
    };
    communication: string[];
}
export interface User {
    id: number;
    username: string;
    email: string;
    displayName: string;
    profilePicture?: string;
    age?: number;
    bio?: string;
    tags?: Tag[];
    preferences?: UserPreferences;
}
export interface UserProfileInput {
    email: string;
    displayName: string;
    profilePicture?: string;
    age?: number;
    bio?: string;
    tags?: Tag[];
    preferences?: UserPreferences;
}
export interface ListedUser {
    id: number;
    username: string;
    email: string;
    displayName: string;
    profilePicture?: string;
    age?: number;
    bio?: string;
    tags?: Tag[];
    preferences?: UserPreferences;
}
export interface PaginatedUsersResponse {
    users: ListedUser[];
    page: number;
    limit: number;
    totalUsers: number;
}
export interface UserState {
    currentUser: User | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    isOnboarded: boolean;
}
