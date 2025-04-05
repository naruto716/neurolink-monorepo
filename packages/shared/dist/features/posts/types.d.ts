export interface Post {
    id: number;
    authorId: number;
    authorUsername: string;
    authorDisplayName: string;
    authorPfpUrl?: string;
    content: string;
    mediaUrls: {
        url: string;
        type: string;
    }[];
    visibility: 'public' | 'friends' | 'private';
    createdAt: string;
    updatedAt: string | null;
    likesCount: number;
    commentsCount: number;
    isLikedByCurrentUser?: boolean;
}
export interface PaginatedPostsResponse {
    userId?: number;
    page: number;
    limit: number;
    totalPosts: number;
    posts: Post[];
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
