import { Request } from 'express';
import { RequestUser } from './jwt.types';

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
