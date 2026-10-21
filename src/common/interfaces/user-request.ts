import type { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface.js';

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
