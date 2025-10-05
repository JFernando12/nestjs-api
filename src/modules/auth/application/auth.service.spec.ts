import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/application/users.service';
import { SignUpDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { UserRole } from '../../../common/interfaces';
import { User } from '../../users/domain/models/user.model';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockJwtToken = 'mock.jwt.token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      role: UserRole.USER,
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      usersService.findOne.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersService.create.mockResolvedValue(mockUser);

      const result = await authService.signUp(signUpDto);

      expect(usersService.findOne).toHaveBeenCalledWith(signUpDto.username);
      expect(usersService.findByEmail).toHaveBeenCalledWith(signUpDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(signUpDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        username: signUpDto.username,
        email: signUpDto.email,
        password: hashedPassword,
        role: UserRole.USER,
      });
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(result.message).toBe('User registered successfully');
      expect(result.data.user.id).toBe(mockUser.id);
      expect(result.data.user.username).toBe(mockUser.username);
      expect(result.data.user.email).toBe(mockUser.email);
      expect(result.data).not.toHaveProperty('access_token');
    });

    it('should throw ConflictException when username already exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(signUpDto.username);
      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findOne.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(signUpDto.username);
      expect(usersService.findByEmail).toHaveBeenCalledWith(signUpDto.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should use default role USER when role is not provided', async () => {
      const signUpDtoWithoutRole = { ...signUpDto, role: undefined };
      const hashedPassword = 'hashedPassword123';
      usersService.findOne.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersService.create.mockResolvedValue(mockUser);

      await authService.signUp(signUpDtoWithoutRole);

      expect(usersService.create).toHaveBeenCalledWith({
        username: signUpDto.username,
        email: signUpDto.email,
        password: hashedPassword,
        role: UserRole.USER,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(mockJwtToken);

      const result = await authService.login(loginDto);

      expect(usersService.findOne).toHaveBeenCalledWith(loginDto.username);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
      expect(result.message).toBe('Login successful');
      expect(result.data.access_token).toBe(mockJwtToken);
      expect(result.data.user.id).toBe(mockUser.id);
      expect(result.data.user.username).toBe(mockUser.username);
      expect(result.data.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(loginDto.username);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(usersService.findOne).toHaveBeenCalledWith(loginDto.username);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle bcrypt errors gracefully', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(authService.login(loginDto)).rejects.toThrow();
      expect(usersService.findOne).toHaveBeenCalledWith(loginDto.username);
    });
  });

  describe('edge cases', () => {
    it('should handle JWT signing errors during login', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

      await expect(authService.login(loginDto)).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });
});
