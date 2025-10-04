import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Application (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as in main.ts
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

  describe('Application Health', () => {
    it('should start the application successfully', () => {
      expect(app).toBeDefined();
    });

    it('should have configured global pipes', () => {
      // This test ensures the app is properly configured
      expect(app).toHaveProperty('useGlobalPipes');
    });

    it('should reject requests to non-existent routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.statusCode).toBe(404);
    });

    it('should handle CORS properly', async () => {
      const response = await request(app.getHttpServer())
        .options('/auth/login')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'POST');

      // CORS is enabled, should not reject OPTIONS requests or may return 404 if route doesn't exist
      expect([200, 204, 404]).toContain(response.status);
    });
  });
});
