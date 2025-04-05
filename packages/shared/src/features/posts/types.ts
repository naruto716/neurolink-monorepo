// packages/shared/src/features/posts/types.ts

/**
 * Represents media attached to a post.
 */
export interface PostMedia {
  url: string;
  type: string; // e.g., 'image', 'video'
}

/**
 * Represents a single post object, aligning with /api/v1/posts/by-usernames response.
 * Also includes fields from the previous definition for broader compatibility.
 */
export interface Post {
  id: number;
  authorId: number;
  content: string;
  mediaUrls: PostMedia[];
  visibility: 'public' | 'friends' | 'private' | string; // Allow string for flexibility
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean; // Note: API response shows boolean

  // Fields from previous definition (might need separate fetching/mapping)
  authorUsername?: string; // Username for linking/API calls
  authorDisplayName?: string; // Name for display
  authorPfpUrl?: string; // Profile picture URL (optional)
}

/**
 * Represents the paginated response structure for posts from /api/v1/posts/by-usernames.
 * Also includes fields from the previous definition.
 */
export interface PaginatedPostsResponse {
  pageNumber: number; // From /by-usernames endpoint
  pageSize: number;   // From /by-usernames endpoint
  totalItems: number; // From /by-usernames endpoint
  totalPages: number; // From /by-usernames endpoint
  items: Post[];      // From /by-usernames endpoint (renamed from 'posts')

  // Fields from previous definition (might be context-dependent)
  userId?: number;
  page?: number; // Can potentially be mapped from pageNumber
  limit?: number; // Can potentially be mapped from pageSize
  totalPosts?: number; // Can potentially be mapped from totalItems
  posts?: Post[]; // Can potentially be mapped from items
}

/**
 * Represents the request body for fetching posts by usernames (POST /api/v1/posts/by-usernames).
 */
export interface FetchPostsByUsernamePayload {
  usernames: string[];
  pageNumber?: number; // Optional, defaults might be handled by backend
  pageSize?: number;   // Optional, defaults might be handled by backend
}


// --- Existing Comment Types ---

// Represents a single Comment based on GET /api/v1/Posts/{postId}/comments response
export interface Comment {
  commentId: number;
  postId: number;
  authorId: number;
  authorName: string; // Username for linking
  authorDisplayName: string; // Name for display
  authorPfpUrl?: string; // Profile picture URL (optional)
  content: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string | null; // ISO 8601 date string or null
}

// Represents the paginated response structure for comments
export interface PaginatedCommentsResponse {
  postId: number;
  page: number;
  limit: number;
  totalComments: number;
  comments: Comment[];
}
