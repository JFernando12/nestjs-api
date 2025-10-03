import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  UserRole,
} from '../../modules/users/infrastructure/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    try {
      const userCount = await this.usersRepository.count();

      if (userCount > 0) {
        return;
      }

      const adminPassword = await bcrypt.hash('Admin123', 10);
      const admin = this.usersRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: UserRole.ADMIN,
      });

      const userPassword = await bcrypt.hash('User123', 10);
      const user = this.usersRepository.create({
        username: 'user',
        email: 'user@example.com',
        password: userPassword,
        role: UserRole.USER,
      });

      await this.usersRepository.save([admin, user]);
    } catch (error) {
      this.logger.error('Error seeding database:', error);
    }
  }
}
