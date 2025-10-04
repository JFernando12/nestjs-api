import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUtils } from './test-utils';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await TestUtils.cleanDatabase(app);
  });

  describe('POST /auth/signup - Registro de usuarios', () => {
    it('should register a new user successfully', async () => {
      const signupData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(201);

      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.username).toBe(signupData.username);
      expect(response.body.data.user.email).toBe(signupData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user.role).toBe('user');
    });

    it('should reject signup with duplicate username', async () => {
      const signupData = {
        username: 'duplicate',
        email: 'first@example.com',
        password: 'Test123',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'duplicate',
          email: 'second@example.com',
          password: 'Test123',
        })
        .expect(409);
    });

    it('should reject signup with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'ab',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login - Login y obtención de token JWT', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/signup').send({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'Password123',
      });
    });

    it('should login successfully and return JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'loginuser',
          password: 'Password123',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('access_token');
      expect(typeof response.body.data.access_token).toBe('string');
      expect(response.body.data.access_token.length).toBeGreaterThan(0);
    });

    it('should reject login with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'loginuser',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject login with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Password123',
        })
        .expect(401);
    });
  });

  describe('Authorization - Roles de usuarios', () => {
    it('should create admin user with admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'admin',
          email: 'admin@example.com',
          password: 'Admin123',
          role: 'admin',
        })
        .expect(201);

      expect(response.body.data.user.role).toBe('admin');
    });

    it('should create regular user by default', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'regular',
          email: 'regular@example.com',
          password: 'Regular123',
        })
        .expect(201);

      expect(response.body.data.user.role).toBe('user');
    });
  });
});
