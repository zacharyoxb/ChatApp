/**
 * Data structure for session information.
 */
export interface SessionData {
  /** User's unique identifier. */
  user_id: string;
  /** Username for user. */
  username: string;
  /** Unix timestamp for when user session was created. */
  created_at: number;
  /** Unix timestamp for the user's most recent activity. */
  last_activity: number;
}
