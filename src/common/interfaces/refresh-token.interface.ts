export interface CreateRefreshTokenParams {
  id: string;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}
