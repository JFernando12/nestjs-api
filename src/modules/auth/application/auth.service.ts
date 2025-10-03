import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { UsersService } from '../../users/application/users.service';
import { UserRole } from '../../../common/interfaces';
import { ApiResponseDto } from '../../../common/dtos';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<
    ApiResponseDto<{
      access_token: string;
      user: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
      };
    }>
  > {
    const existingUser = await this.usersService.findOne(signUpDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findByEmail(signUpDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const user = await this.usersService.create({
      username: signUpDto.username,
      email: signUpDto.email,
      password: hashedPassword,
      role: signUpDto.role || UserRole.USER,
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    return new ApiResponseDto('User registered successfully', {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  async login(loginDto: LoginDto): Promise<
    ApiResponseDto<{
      access_token: string;
      user: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
      };
    }>
  > {
    const user = await this.usersService.findOne(loginDto.username);

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    return new ApiResponseDto('Login successful', {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }
}
