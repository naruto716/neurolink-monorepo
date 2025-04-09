import { User } from '../user/types';
export interface CommitmentParticipant {
    id: number;
    username: string;
    displayName: string;
    profilePicture: string;
    role: string;
}
export interface Commitment {
    id: number;
    title: string;
    description: string;
    dateTime: string;
    location: {
        description: string;
    };
    creatorUsername: string;
    participants: CommitmentParticipant[];
}
export interface PaginatedCommitmentsResponse {
    items: Commitment[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}
export type PaginatedSentInvitationsResponse = PaginatedCommitmentsResponse;
export interface ReceivedInvitationCommitment {
    id: number;
    title: string;
    description: string;
    dateTime: string;
    location: {
        description: string;
    };
    creatorUsername: string;
}
export interface ReceivedInvitation {
    id: number;
    commitmentId: number;
    invitedUserId: number;
    status: string;
    createdAt: string;
    respondedAt: string | null;
    commitment: ReceivedInvitationCommitment;
}
export interface PaginatedReceivedInvitationsResponse {
    items: ReceivedInvitation[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}
export interface CreateCommitmentRequest {
    title: string;
    description: string;
    dateTime: string;
    location: {
        description: string;
    };
}
export interface SentInvitationDetail {
    id: number;
    invitor: User;
    invitee: User;
    commitment: {
        id: number;
        title: string;
        description: string;
        dateTime: string;
        location: {
            description: string;
        };
        creatorUsername: string;
    };
    status: string;
    createdAt: string;
    respondedAt: string | null;
}
export interface PaginatedSentInvitationsDetailResponse {
    items: SentInvitationDetail[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}
