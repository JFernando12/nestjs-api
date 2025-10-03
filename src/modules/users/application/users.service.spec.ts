import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersTypeOrmRepository } from '../infrastructure/repositories/users.typeorm.repository';
import { User } from '../domain/models/user.model';
import { UserRole } from '../../../common/interfaces';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersTypeOrmRepository>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersTypeOrmRepository,
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersTypeOrmRepository);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a user by username', async () => {
      // Arrange
      const username = 'testuser';
      repository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(username);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith(username);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      // Arrange
      const username = 'nonexistent';
      repository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findOne(username);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith(username);
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const username = 'testuser';
      repository.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findOne(username)).rejects.toThrow('Database error');
      expect(repository.findOne).toHaveBeenCalledWith(username);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      repository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found by id', async () => {
      // Arrange
      const userId = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should handle repository errors when finding by id', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      repository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findById(userId)).rejects.toThrow('Database error');
      expect(repository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(repository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found by email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      repository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(repository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeNull();
    });

    it('should handle repository errors when finding by email', async () => {
      // Arrange
      const email = 'test@example.com';
      repository.findByEmail.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findByEmail(email)).rejects.toThrow(
        'Database error',
      );
      expect(repository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should handle case-sensitive email searches', async () => {
      // Arrange
      const email = 'Test@Example.com';
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(repository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData: Partial<User> = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
      };
      const createdUser = { ...mockUser, ...userData };
      repository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(userData);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(createdUser);
      expect(result.username).toBe(userData.username);
      expect(result.email).toBe(userData.email);
    });

    it('should create user with admin role', async () => {
      // Arrange
      const userData: Partial<User> = {
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'hashedPassword',
        role: UserRole.ADMIN,
      };
      const createdUser = {
        ...mockUser,
        ...userData,
        role: UserRole.ADMIN,
      };
      repository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(userData);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const userData: Partial<User> = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        role: UserRole.USER,
      };
      repository.create.mockRejectedValue(
        new Error('Database constraint error'),
      );

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(
        'Database constraint error',
      );
      expect(repository.create).toHaveBeenCalledWith(userData);
    });

    it('should create user with minimum required fields', async () => {
      // Arrange
      const userData: Partial<User> = {
        username: 'minimaluser',
        email: 'minimal@example.com',
        password: 'hashedPassword',
      };
      const createdUser = {
        ...mockUser,
        ...userData,
        role: UserRole.USER,
      };
      repository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.create(userData);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(result.username).toBe(userData.username);
      expect(result.email).toBe(userData.email);
    });
  });

  describe('integration scenarios', () => {
    it('should support finding a user and then updating through create', async () => {
      // Arrange
      const username = 'testuser';
      const updateData: Partial<User> = {
        email: 'updated@example.com',
      };
      repository.findOne.mockResolvedValue(mockUser);
      repository.create.mockResolvedValue({
        ...mockUser,
        ...updateData,
      });

      // Act
      const existingUser = await service.findOne(username);
      const updatedUser = await service.create({
        ...existingUser,
        ...updateData,
      });

      // Assert
      expect(existingUser).toEqual(mockUser);
      expect(updatedUser.email).toBe(updateData.email);
    });

    it('should handle multiple sequential queries', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(mockUser);
      repository.findById.mockResolvedValue(mockUser);
      repository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const byUsername = await service.findOne('testuser');
      const byId = await service.findById(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      const byEmail = await service.findByEmail('test@example.com');

      // Assert
      expect(byUsername).toEqual(mockUser);
      expect(byId).toEqual(mockUser);
      expect(byEmail).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findByEmail).toHaveBeenCalledTimes(1);
    });
  });
});
