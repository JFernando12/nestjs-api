import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces';

export class TestUtils {
  static createMockExecutionContext(
    request: Partial<AuthenticatedRequest> = {},
  ): ExecutionContext {
    const mockRequest: Partial<AuthenticatedRequest> = {
      headers: {},
      body: {},
      params: {},
      query: {},
      ...request,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
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
    } as unknown as ExecutionContext;
  }

  static createAuthenticatedRequest(
    user: any,
    overrides?: Partial<AuthenticatedRequest>,
  ): AuthenticatedRequest {
    return {
      user,
      headers: {
        authorization: 'Bearer mock.jwt.token',
      },
      body: {},
      params: {},
      query: {},
      ...overrides,
    } as AuthenticatedRequest;
  }

  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static createMockRepository() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findBySwapiId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };
  }

  static createMockJwtService() {
    return {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };
  }

  static createMockConfigService(config: Record<string, any> = {}) {
    return {
      get: jest.fn((key: string) => {
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
          value = value?.[k];
        }
        return value;
      }),
      getOrThrow: jest.fn((key: string) => {
        const value = config[key];
        if (value === undefined) {
          throw new Error(`Configuration key "${key}" not found`);
        }
        return value;
      }),
    };
  }

  static createMockHttpService() {
    return {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      head: jest.fn(),
      request: jest.fn(),
      axiosRef: {} as any,
    };
  }

  static createMockReflector() {
    return {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };
  }

  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  static generateMockJWT(): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({ sub: '1234567890', name: 'Test User', iat: 1516239022 }),
    ).toString('base64');
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }

  static createPaginationMeta(page: number, limit: number, total: number): any {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }

  static async assertThrowsAsync(
    fn: () => Promise<any>,
    errorType: any,
    errorMessage?: string,
  ): Promise<void> {
    let error: any;
    try {
      await fn();
    } catch (e) {
      error = e;
    }

    if (!error) {
      throw new Error('Expected function to throw an error');
    }

    if (!(error instanceof errorType)) {
      throw new Error(
        `Expected error to be instance of ${errorType.name}, but got ${error.constructor.name}`,
      );
    }

    if (errorMessage && error.message !== errorMessage) {
      throw new Error(
        `Expected error message to be "${errorMessage}", but got "${error.message}"`,
      );
    }
  }

  static resetAllMocks(mockObject: Record<string, any>): void {
    Object.values(mockObject).forEach((value) => {
      if (typeof value === 'function' && 'mockReset' in value) {
        value.mockReset();
      }
    });
  }

  static clearAllMocks(mockObject: Record<string, any>): void {
    Object.values(mockObject).forEach((value) => {
      if (typeof value === 'function' && 'mockClear' in value) {
        value.mockClear();
      }
    });
  }
}
