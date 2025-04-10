// packages/shared/src/features/forum/types.ts

/**
 * DTO for a single forum post response.
 * Based on PostResponseDTO schema in forumapi.json
 */
export interface PostResponseDTO {
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
  posts: PostResponseDTO[];
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
}

/**
* DTO for a single comment response.
* Based on CommentResponseDTO schema in forumapi.json
*/
export interface CommentResponseDTO {
id: string;
username: string;
post_id: string;
content: string;
created_at: string; // ISO 8601 date string
}

/**
* DTO for creating a new comment.
* Based on CommentCreateDTO schema in forumapi.json
*/
export interface CommentCreateDTO {
content: string;
}

/**
* DTO for the paginated response when fetching comments.
* Based on PaginatedCommentsResponseDTO schema in forumapi.json
*/
export interface PaginatedCommentsResponseDTO {
comments: CommentResponseDTO[];
total_comments: number;
total_pages: number;
next_page_url?: string | null;
prev_page_url?: string | null;
}

/**
* Parameters for fetching comments for a post.
* Based on GET /api/v1/forum/posts/{post_id}/comments parameters in forumapi.json
*/
export interface FetchCommentsParams {
page?: number;
size?: number;
}

/**
* DTO for the detailed post response including comments.
* Based on PostDetailResponseDTO schema in forumapi.json
*/
export interface PostDetailResponseDTO extends PostResponseDTO {
// Inherits fields from PostResponseDTO
comments: CommentResponseDTO[];
}

/**
* DTO for the like response.
* Based on LikeResponse schema in forumapi.json
*/
export interface LikeResponse {
message: string; // e.g., "Post liked successfully."
}
// Removed misplaced lines 89 and 90

// Add other DTOs from forumapi.json as needed (e.g., for creating posts, comments)
// CommentCreateDTO, CommentResponseDTO, PostUpdateDTO etc.

/**
 * DTO for creating a new forum post.
 * Based on PostCreateDTO schema in forumapi.json
 */
export interface PostCreateDTO {
  title: string;
  content: string;
  tags?: string[];
}

/**
 * DTO for a single tag response.
 * Based on TagResponseDTO schema in forumapi.json
 */
export interface TagResponseDTO {
    id: number;
    name: string;
}

/**
 * DTO for the paginated response when fetching tags.
 * Based on PaginatedTagsResponseDTO schema in forumapi.json
 */
export interface PaginatedTagsResponseDTO {
    tags: TagResponseDTO[];
    total_tags: number;
    total_pages: number;
    next_page_url?: string | null;
    prev_page_url?: string | null;
}

/**
 * Parameters for fetching tags.
 * Based on GET /api/v1/forum/tags parameters in forumapi.json
 */
export interface FetchTagsParams {
    page?: number;
    size?: number;
    search?: string;
}