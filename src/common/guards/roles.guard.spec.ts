import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../interfaces';
import { AuthenticatedRequest } from '../interfaces';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockAdminUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockRegularUser = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  const createMockExecutionContext = (
    requestOverrides: any = {},
  ): ExecutionContext => {
    const defaultRequest = {
      user: mockRegularUser,
      ...requestOverrides,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => defaultRequest as AuthenticatedRequest,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalled();
    });

    it('should allow access when user has required role', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockAdminUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockAdminUser });
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.USER,
      ]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow regular user access to user-only routes', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockRegularUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockRegularUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      // Arrange
      const context = createMockExecutionContext({ user: undefined });
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    it('should throw ForbiddenException when user is null', () => {
      // Arrange
      const context = createMockExecutionContext({ user: null });
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    it('should check for ROLES_KEY on both handler and class', () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      guard.canActivate(context);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        expect.any(String),
        [context.getHandler(), context.getClass()],
      );
    });

    it('should handle empty roles array', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockRegularUser });
      reflector.getAllAndOverride.mockReturnValue([]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('should work with admin accessing user routes', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockAdminUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.USER]);

      // Act & Assert
      // Admin should NOT have access to USER-only routes
      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('should handle multiple required roles correctly', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockRegularUser });
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.USER,
      ]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user role does not match any required roles', () => {
      // Arrange
      const context = createMockExecutionContext({ user: mockRegularUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });
  });

  describe('integration with AuthGuard', () => {
    it('should work when user is properly authenticated', () => {
      // Arrange
      const authenticatedUser = {
        id: '123',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };
      const context = createMockExecutionContext({ user: authenticatedUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should fail when user is missing required properties', () => {
      // Arrange
      const incompleteUser = {
        id: '123',
        email: 'test@example.com',
        // role is missing
      };
      const context = createMockExecutionContext({ user: incompleteUser });
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
