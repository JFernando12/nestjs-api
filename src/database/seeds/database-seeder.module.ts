import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeederService } from './database-seeder.service';
import { User } from '../../modules/users/infrastructure/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [DatabaseSeederService],
  exports: [DatabaseSeederService],
})
export class DatabaseSeederModule {}
