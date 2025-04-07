/**
 * Represents the response structure from the /chat/token endpoint.
 */
export interface ChatTokenResponse {
  apiKey: string;
  token: string;
  userId: string;
}
