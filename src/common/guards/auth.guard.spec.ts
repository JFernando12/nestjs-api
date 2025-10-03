import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { UserRole } from '../interfaces';
import { AuthenticatedRequest } from '../interfaces';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;
  let configService: jest.Mocked<ConfigService>;

  const mockJwtPayload = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const mockRequest = {
    headers: {
      authorization: 'Bearer valid.jwt.token',
    },
  } as Partial<AuthenticatedRequest>;

  const createMockExecutionContext = (
    request: Partial<AuthenticatedRequest> = mockRequest,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
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
    }) as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService);
    reflector = module.get(Reflector);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes without token', async () => {
      // Arrange
      const context = createMockExecutionContext({
        headers: {},
      } as Partial<AuthenticatedRequest>);
      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalled();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should allow access with valid JWT token', async () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue(mockJwtPayload);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
      expect(configService.get).toHaveBeenCalledWith('jwt.secret');
    });

    it('should attach user to request when token is valid', async () => {
      // Arrange
      const request = { ...mockRequest } as AuthenticatedRequest;
      const context = createMockExecutionContext(request);
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue(mockJwtPayload);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(request.user).toBeDefined();
      expect(request.user?.id).toBe(mockJwtPayload.sub);
      expect(request.user?.email).toBe(mockJwtPayload.email);
      expect(request.user?.role).toBe(mockJwtPayload.role);
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      // Arrange
      const context = createMockExecutionContext({
        headers: {},
      } as Partial<AuthenticatedRequest>);
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token not found'),
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle authorization header without Bearer prefix', async () => {
      // Arrange
      const context = createMockExecutionContext({
        headers: {
          authorization: 'invalid.format',
        },
      } as Partial<AuthenticatedRequest>);
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle missing authorization header', async () => {
      // Arrange
      const context = createMockExecutionContext({
        headers: {},
      } as Partial<AuthenticatedRequest>);
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token not found'),
      );
    });

    it('should work with admin role', async () => {
      // Arrange
      const adminPayload = { ...mockJwtPayload, role: UserRole.ADMIN };
      const request = { ...mockRequest } as AuthenticatedRequest;
      const context = createMockExecutionContext(request);
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue(adminPayload);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(request.user?.role).toBe(UserRole.ADMIN);
    });

    it('should check for IS_PUBLIC_KEY on both handler and class', async () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        expect.any(String),
        [context.getHandler(), context.getClass()],
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer authorization header', async () => {
      // Arrange
      const context = createMockExecutionContext({
        headers: {
          authorization: 'Bearer my.test.token',
        },
      } as Partial<AuthenticatedRequest>);
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue(mockJwtPayload);

      // Act
      await guard.canActivate(context);

      // Assert
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('my.test.token', {
        secret: 'test-secret',
      });
    });

    it('should handle authorization header with extra spaces', async () => {
      // Arrange
      const context = createMockExecutionContext({
        headers: {
          authorization: 'Bearer  token.with.spaces',
        },
      } as Partial<AuthenticatedRequest>);
      reflector.getAllAndOverride.mockReturnValue(false);

      // Act & Assert
      // This should fail because the split will result in empty string or undefined
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
