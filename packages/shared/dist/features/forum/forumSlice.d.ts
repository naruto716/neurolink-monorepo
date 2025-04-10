import { AsyncThunk } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { PostResponseDTO, // Renamed from ForumPostDTO
PaginatedForumPostsResponseDTO, FetchForumPostsParams, PostCreateDTO, TagResponseDTO, PaginatedTagsResponseDTO, FetchTagsParams, PostDetailResponseDTO, // Add detail DTO
CommentCreateDTO, // Add comment DTOs
CommentResponseDTO, PaginatedCommentsResponseDTO, FetchCommentsParams } from './types';
import { SharedRootState } from '../../app/store/store';
export interface ForumState {
    posts: PostResponseDTO[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    tags: TagResponseDTO[];
    tagsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    tagsError: string | null;
    tagsCurrentPage: number;
    tagsTotalPages: number;
    tagsTotalTags: number;
    createPostStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    createPostError: string | null;
    selectedPost: PostDetailResponseDTO | null;
    selectedPostStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    selectedPostError: string | null;
    comments: CommentResponseDTO[];
    commentsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    commentsError: string | null;
    commentsCurrentPage: number;
    commentsTotalPages: number;
    commentsTotalComments: number;
    createCommentStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    createCommentError: string | null;
    likeStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    likeError: string | null;
}
type FetchForumPostsThunkArg = {
    apiClient: AxiosInstance;
    params?: FetchForumPostsParams;
};
export declare const fetchForumPosts: AsyncThunk<PaginatedForumPostsResponseDTO, FetchForumPostsThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
type CreatePostThunkArg = {
    apiClient: AxiosInstance;
    postData: PostCreateDTO;
};
export declare const createPost: AsyncThunk<PostResponseDTO, CreatePostThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
type FetchPostByIdThunkArg = {
    apiClient: AxiosInstance;
    postId: string;
};
export declare const fetchPostById: AsyncThunk<PostDetailResponseDTO, FetchPostByIdThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
type FetchCommentsThunkArg = {
    apiClient: AxiosInstance;
    postId: string;
    params?: FetchCommentsParams;
};
export declare const fetchComments: AsyncThunk<PaginatedCommentsResponseDTO, FetchCommentsThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
type CreateCommentThunkArg = {
    apiClient: AxiosInstance;
    postId: string;
    commentData: CommentCreateDTO;
};
export declare const createComment: AsyncThunk<CommentResponseDTO, CreateCommentThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
type LikePostThunkArg = {
    apiClient: AxiosInstance;
    postId: string;
};
export declare const likePost: AsyncThunk<LikeResponse, LikePostThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
type FetchTagsThunkArg = {
    apiClient: AxiosInstance;
    params?: FetchTagsParams;
};
export declare const fetchTags: AsyncThunk<PaginatedTagsResponseDTO, FetchTagsThunkArg, {
    rejectValue: string;
    state: SharedRootState;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const resetForumState: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"forum/resetForumState">, clearSelectedPost: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"forum/clearSelectedPost">;
declare const _default: import("redux").Reducer<ForumState>;
export default _default;
export declare const selectForumPosts: (state: SharedRootState) => PostResponseDTO[];
export declare const selectForumStatus: (state: SharedRootState) => ForumState["status"];
export declare const selectForumError: (state: SharedRootState) => string | null;
export declare const selectForumCurrentPage: (state: SharedRootState) => number;
export declare const selectForumTotalPages: (state: SharedRootState) => number;
export declare const selectForumTotalPosts: (state: SharedRootState) => number;
export declare const selectForumTags: (state: SharedRootState) => TagResponseDTO[];
export declare const selectForumTagsStatus: (state: SharedRootState) => ForumState["tagsStatus"];
export declare const selectForumTagsError: (state: SharedRootState) => string | null;
export declare const selectForumTagsCurrentPage: (state: SharedRootState) => number;
export declare const selectForumTagsTotalPages: (state: SharedRootState) => number;
export declare const selectForumTagsTotalTags: (state: SharedRootState) => number;
export declare const selectCreatePostStatus: (state: SharedRootState) => ForumState["createPostStatus"];
export declare const selectCreatePostError: (state: SharedRootState) => string | null;
export declare const selectSelectedPost: (state: SharedRootState) => PostDetailResponseDTO | null;
export declare const selectSelectedPostStatus: (state: SharedRootState) => ForumState["selectedPostStatus"];
export declare const selectSelectedPostError: (state: SharedRootState) => string | null;
export declare const selectPostComments: (state: SharedRootState) => CommentResponseDTO[];
export declare const selectCommentsStatus: (state: SharedRootState) => ForumState["commentsStatus"];
export declare const selectCommentsError: (state: SharedRootState) => string | null;
export declare const selectCommentsCurrentPage: (state: SharedRootState) => number;
export declare const selectCommentsTotalPages: (state: SharedRootState) => number;
export declare const selectCommentsTotalComments: (state: SharedRootState) => number;
export declare const selectCreateCommentStatus: (state: SharedRootState) => ForumState["createCommentStatus"];
export declare const selectCreateCommentError: (state: SharedRootState) => string | null;
export declare const selectLikeStatus: (state: SharedRootState) => ForumState["likeStatus"];
export declare const selectLikeError: (state: SharedRootState) => string | null;
