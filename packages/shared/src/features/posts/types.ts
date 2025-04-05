// Represents a single Post based on GET /users/{username}/posts response
export interface Post {
  id: number;
  authorId: number;
  content: string;
  mediaUrls: { url: string; type: string }[];
  visibility: 'public' | 'friends' | 'private'; // Assuming these visibilities from common patterns
  createdAt: string; // ISO 8601 date string
  updatedAt: string | null; // ISO 8601 date string or null
  likesCount: number;
  commentsCount: number;
}

// Represents the paginated response structure from GET /users/{username}/posts
export interface PaginatedPostsResponse {
  userId?: number; // Optional, might not be in all post list responses
  page: number;
  limit: number;
  totalPosts: number;
  posts: Post[];
}
