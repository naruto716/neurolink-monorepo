/**
 * Represents media attached to a post.
 */
export interface PostMedia {
    url: string;
    type: string;
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
    visibility: 'public' | 'friends' | 'private' | string;
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    commentsCount: number;
    isLikedByCurrentUser: boolean;
    authorUsername?: string;
    authorDisplayName?: string;
    authorPfpUrl?: string;
}
/**
 * Represents the paginated response structure for posts from /api/v1/posts/by-usernames.
 * Also includes fields from the previous definition.
 */
export interface PaginatedPostsResponse {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    items: Post[];
    userId?: number;
    page?: number;
    limit?: number;
    totalPosts?: number;
    posts?: Post[];
}
/**
 * Represents the request body for fetching posts by usernames (POST /api/v1/posts/by-usernames).
 */
export interface FetchPostsByUsernamePayload {
    usernames: string[];
    pageNumber?: number;
    pageSize?: number;
}
export interface Comment {
    commentId: number;
    postId: number;
    authorId: number;
    authorName: string;
    authorDisplayName: string;
    authorPfpUrl?: string;
    content: string;
    createdAt: string;
    updatedAt: string | null;
}
export interface PaginatedCommentsResponse {
    postId: number;
    page: number;
    limit: number;
    totalComments: number;
    comments: Comment[];
}
