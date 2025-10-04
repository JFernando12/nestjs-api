import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestUtils } from './test-utils';

describe('Movies (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

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

    const admin = await TestUtils.createAdminUser(app);
    adminToken = admin.token;

    const user = await TestUtils.createRegularUser(app);
    userToken = user.token;
  });

  describe('POST /movies - Solo Administradores pueden crear', () => {
    const movieData = TestUtils.createMovieData({
      title: 'A New Hope',
      episode_id: 4,
    });

    it('should create a movie as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(movieData)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(movieData.title);
    });

    it('should reject movie creation by regular user', async () => {
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(movieData)
        .expect(403);
    });

    it('should reject movie creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/movies')
        .send(movieData)
        .expect(401);
    });
  });

  describe('GET /movies - Lista disponible públicamente', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        await TestUtils.createMovie(app, adminToken, {
          title: `Movie ${i}`,
          episode_id: i,
        });
      }
    });

    it('should get all movies without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return paginated results', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta.total).toBe(5);
    });
  });

  describe('GET /movies/:id - Solo Usuarios Regulares y Admin', () => {
    let movieId: string;

    beforeEach(async () => {
      const movie = await TestUtils.createMovie(app, adminToken);
      movieId = movie.id;
    });

    it('should get a movie by id as regular user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(movieId);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get(`/movies/${movieId}`).expect(401);
    });

    it('should return 404 for non-existent movie', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      await request(app.getHttpServer())
        .get(`/movies/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PATCH /movies/:id - Solo Administradores pueden actualizar', () => {
    let movieId: string;

    beforeEach(async () => {
      const movie = await TestUtils.createMovie(app, adminToken);
      movieId = movie.id;
    });

    it('should update a movie as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should reject movie update by regular user', async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should reject movie update without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .send({ title: 'Hacked' })
        .expect(401);
    });
  });

  describe('DELETE /movies/:id - Solo Administradores pueden eliminar', () => {
    let movieId: string;

    beforeEach(async () => {
      const movie = await TestUtils.createMovie(app, adminToken);
      movieId = movie.id;
    });

    it('should delete a movie as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject movie deletion by regular user', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should reject movie deletion without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .expect(401);
    });
  });
});
