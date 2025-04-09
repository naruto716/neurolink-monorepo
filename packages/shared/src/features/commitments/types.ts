import { User } from '../user/types';

// Define the Participant type based on the API response schema
export interface CommitmentParticipant {
  id: number;
  username: string;
  displayName: string;
  profilePicture: string;
  role: string;
}

// Define the Commitment type based on the API response schema
export interface Commitment {
  id: number;
  title: string;
  description: string;
  dateTime: string; // ISO date string, e.g., "2025-04-09T01:20:55.229Z"
  location: {
    description: string;
  };
  creatorUsername: string;
  participants: CommitmentParticipant[];
}

// Interface for paginated commitments response
export interface PaginatedCommitmentsResponse {
  items: Commitment[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalItems: number; // Or totalCount, check API consistency
}

// --- Invitation Types ---

// Sent Invitations are essentially Commitments from the perspective of the sender
// So we can reuse the PaginatedCommitmentsResponse for sent invitations
export type PaginatedSentInvitationsResponse = PaginatedCommitmentsResponse;

// Type for the nested commitment object within a ReceivedInvitation
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

// Define the ReceivedInvitation type based on the API response schema
export interface ReceivedInvitation {
    id: number;
    commitmentId: number;
    invitedUserId: number; // Assuming this refers to the recipient's user ID
    status: string; // e.g., "pending", "accepted", "declined"
    createdAt: string;
    respondedAt: string | null; // Can be null if not yet responded
    commitment: ReceivedInvitationCommitment;
}

// Interface for paginated received invitations response
export interface PaginatedReceivedInvitationsResponse {
    items: ReceivedInvitation[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}


// Input type for creating a new commitment
export interface CreateCommitmentRequest {
  title: string;
  description: string;
  dateTime: string; // ISO date string
  location: {
    description: string;
  };
}

// You might also want types for API requests if needed, e.g., for creating/updating commitments
// export interface UpdateCommitmentRequest { ... }

// Define the SentInvitationDetail type based on the new API response schema
// GET /api/v1/Commitment/invitations/detail/sent/{username}
export interface SentInvitationDetail {
  id: number;
  invitor: User; // Reusing the User type
  invitee: User; // Reusing the User type
  commitment: { // Using a subset of Commitment or defining inline
    id: number;
    title: string;
    description: string;
    dateTime: string; // ISO date string
    location: {
      description: string;
    };
    creatorUsername: string; // Keep this? API shows it, might be redundant if invitor is always creator
  };
  status: string; // e.g., "pending", "accepted", "rejected"
  createdAt: string; // ISO date string
  respondedAt: string | null; // ISO date string or null
}

// Interface for the paginated response of detailed sent invitations
export interface PaginatedSentInvitationsDetailResponse {
  items: SentInvitationDetail[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}
