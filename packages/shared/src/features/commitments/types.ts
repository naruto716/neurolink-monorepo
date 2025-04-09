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

// You might also want types for API requests if needed, e.g., for creating/updating commitments
// export interface CreateCommitmentRequest { ... }
// export interface UpdateCommitmentRequest { ... }
