import { Injectable } from '@nestjs/common';
import { UsersTypeOrmRepository } from '../infrastructure/repositories/users.typeorm.repository';
import { User } from '../domain/models/user.model';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersTypeOrmRepository) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne(username);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(userData: Partial<User>): Promise<User> {
    return this.usersRepository.create(userData);
  }
}
