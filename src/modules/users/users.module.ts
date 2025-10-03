import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersTypeOrmRepository } from './infrastructure/repositories/users.typeorm.repository';
import { UsersService } from './application/users.service';
import { User } from './infrastructure/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersTypeOrmRepository, UsersService],
  exports: [UsersService, UsersTypeOrmRepository],
})
export class UsersModule {}
