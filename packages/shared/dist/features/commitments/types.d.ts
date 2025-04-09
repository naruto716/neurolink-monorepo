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
