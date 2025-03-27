export interface Post {
    id: number;
    username: string;
    avatar: string;
    date: string;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    tags?: string[];
}
export interface PostsResponse {
    posts: Post[];
    total: number;
    page: number;
    pageSize: number;
}
export interface CreatePostRequest {
    content: string;
    image?: string;
    tags?: string[];
}
/**
 * Get all posts with pagination
 * @param page Page number (starts at 1)
 * @param pageSize Number of posts per page
 * @returns Promise with posts response
 */
export declare const getPosts: (page?: number, pageSize?: number) => Promise<PostsResponse>;
/**
 * Get a single post by ID
 * @param id Post ID
 * @returns Promise with post data
 */
export declare const getPostById: (id: number) => Promise<Post>;
/**
 * Create a new post
 * @param postData Post creation data
 * @returns Promise with created post
 */
export declare const createPost: (postData: CreatePostRequest) => Promise<Post>;
/**
 * Like a post
 * @param id Post ID
 * @returns Promise with updated post
 */
export declare const likePost: (id: number) => Promise<Post>;
