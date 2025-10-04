import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUtils } from './test-utils';

describe('Star Wars (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

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

  beforeEach(async () => {
    // Clean database before each test
    await TestUtils.cleanDatabase(app);

    // Create admin and regular user for tests
    const admin = await TestUtils.createAdminUser(app);
    adminToken = admin.token;

    const user = await TestUtils.createRegularUser(app);
    userToken = user.token;
  });

  describe('POST /star-wars/sync', () => {
    it('should synchronize movies from SWAPI as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/star-wars/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('synchronized');
      expect(response.body).toHaveProperty('message');
      expect(response.body.synchronized).toBeGreaterThan(0);
    }, 60000);

    it('should reject sync request from regular user', async () => {
      const response = await request(app.getHttpServer())
        .post('/star-wars/sync')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toBeDefined();
    });

    it('should reject sync request without authentication', async () => {
      await request(app.getHttpServer()).post('/star-wars/sync').expect(401);
    });

    it('should create movies with correct structure', async () => {
      // Perform sync
      await request(app.getHttpServer())
        .post('/star-wars/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      // Verify movies are in database with correct structure
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .query({ limit: 1 })
        .expect(200);

      expect(moviesResponse.body.data.length).toBeGreaterThan(0);

      const movie = moviesResponse.body.data[0];
      expect(movie).toHaveProperty('id');
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('episode_id');
      expect(movie).toHaveProperty('director');
      expect(typeof movie.title).toBe('string');
      expect(typeof movie.episode_id).toBe('number');
    }, 60000);
  });
});
