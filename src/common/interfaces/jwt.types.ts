import { UserRole } from './user.types';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: number;
  email: string;
  role: UserRole;
}
