// packages/shared/src/features/forum/types.ts

/**
 * DTO for a single forum post response.
 * Based on PostResponseDTO schema in forumapi.json
 */
export interface ForumPostDTO {
  id: string;
  username: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments_count: number;
  created_at: string; // ISO 8601 date string
}

/**
 * DTO for the paginated response when fetching multiple forum posts.
 * Based on PaginatedPostsResponseDTO schema in forumapi.json
 */
export interface PaginatedForumPostsResponseDTO {
  posts: ForumPostDTO[];
  total_posts: number;
  total_pages: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

/**
 * Parameters for fetching forum posts.
 * Based on GET /api/v1/forum/posts parameters in forumapi.json
 */
export interface FetchForumPostsParams {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
}

// Add other DTOs from forumapi.json as needed (e.g., for creating posts, comments)
// CommentCreateDTO, CommentResponseDTO, PostCreateDTO, PostUpdateDTO etc.