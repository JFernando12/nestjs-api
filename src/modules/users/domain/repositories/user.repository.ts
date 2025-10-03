import { User } from '../models/user.model';

export interface IUserRepository {
  findOne(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: Partial<User>): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
