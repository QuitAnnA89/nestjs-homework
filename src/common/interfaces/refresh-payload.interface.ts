import { JwtPayload } from './jwt-payload.interface.js';

export interface RefreshPayload extends JwtPayload {
  jti: string;
}
