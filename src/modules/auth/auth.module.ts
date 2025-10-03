import { Module } from '@nestjs/common';
import { AuthService } from './application/auth.service';
import { AuthController } from './application/auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
