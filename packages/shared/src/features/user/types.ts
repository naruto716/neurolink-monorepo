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

// Represents the *currently logged-in* user object (from GET /users/me)
// Based on the provided example response for this endpoint
export interface User { // Restored original name
  id: number;
  username: string;
  email: string;
  displayName: string;
  profilePicture?: string; 
  age?: number; 
  bio?: string; 
  tags?: Tag[];
  preferences?: UserPreferences;
  // Add any other fields *specifically* returned by /users/me if different
}

// Represents the input structure for creating a user (POST /users)
export interface UserProfileInput {
  email: string;
  displayName: string;
  profilePicture?: string;
  age?: number;
  bio?: string;
  tags?: Tag[];
  preferences?: UserPreferences; 
}

// Represents a user object as returned *in the list* from GET /users
// Based *only* on the provided example response for this endpoint
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
    // Note: 'title' was used before based on wireframe, but is not in the API example. Removed.
}

// Represents the paginated response structure from GET /users (Matching actual API)
export interface PaginatedUsersResponse {
  users: ListedUser[]; // Use the ListedUser interface
  page: number; 
  limit: number; 
  totalUsers: number; 
  // These might not be provided by the API based on the example, make optional or calculate if needed
  // totalPages?: number; 
  // hasPreviousPage?: boolean;
  // hasNextPage?: boolean;
}

// Represents the state for the *currently logged-in* user in Redux
export interface UserState {
  currentUser: User | null; // Uses the restored User interface
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isOnboarded: boolean; 
}
