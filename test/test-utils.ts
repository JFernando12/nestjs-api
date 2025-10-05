import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';

export class TestUtils {
  static async cleanDatabase(app: INestApplication): Promise<void> {
    const dataSource = app.get(DataSource);
    const entities = dataSource.entityMetadatas;

    await dataSource.query('SET CONSTRAINTS ALL DEFERRED');

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      );
    }

    await dataSource.query('SET CONSTRAINTS ALL IMMEDIATE');
  }

  static async createUserAndGetToken(
    app: INestApplication,
    userData: {
      username: string;
      email: string;
      password: string;
      role?: string;
    },
  ): Promise<{ token: string; userId: string }> {
    // First, register the user
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(userData)
      .expect(201);

    const userId = signupResponse.body.data.user.id;

    // Then, login to get the token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: userData.username,
        password: userData.password,
      })
      .expect(200);

    return {
      token: loginResponse.body.data.access_token,
      userId: userId,
    };
  }

  static async loginUser(
    app: INestApplication,
    credentials: { username: string; password: string },
  ): Promise<{ token: string; userId: string }> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    return {
      token: response.body.data.access_token,
      userId: response.body.data.user.id,
    };
  }

  static async createAdminUser(
    app: INestApplication,
  ): Promise<{ token: string; userId: string }> {
    return this.createUserAndGetToken(app, {
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123',
      role: 'admin',
    });
  }

  static async createRegularUser(
    app: INestApplication,
  ): Promise<{ token: string; userId: string }> {
    return this.createUserAndGetToken(app, {
      username: 'user',
      email: 'user@example.com',
      password: 'User123',
      role: 'user',
    });
  }

  static async createMovie(
    app: INestApplication,
    token: string,
    movieData?: Partial<any>,
  ) {
    const defaultMovie = {
      title: 'A New Hope',
      episode_id: 4,
      opening_crawl: 'It is a period of civil war...',
      director: 'George Lucas',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1977-05-25',
      characters: ['Luke Skywalker', 'Darth Vader'],
      planets: ['Tatooine', 'Alderaan'],
      starships: ['X-wing', 'TIE Fighter'],
      vehicles: ['Sandcrawler'],
      species: ['Human', 'Droid'],
      ...movieData,
    };

    const response = await request(app.getHttpServer())
      .post('/movies')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultMovie)
      .expect(201);

    return response.body.data;
  }

  static createMovieData(overrides?: Partial<any>) {
    return {
      title: 'Test Movie',
      episode_id: 1,
      opening_crawl: 'Test opening crawl',
      director: 'Test Director',
      producer: 'Test Producer',
      release_date: '2025-01-01',
      characters: ['Character 1'],
      planets: ['Planet 1'],
      starships: ['Starship 1'],
      vehicles: ['Vehicle 1'],
      species: ['Species 1'],
      ...overrides,
    };
  }

  static createUserData(overrides?: Partial<any>) {
    const timestamp = Date.now();
    return {
      username: `user${timestamp}`,
      email: `user${timestamp}@example.com`,
      password: 'Password123',
      ...overrides,
    };
  }

  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static extractValidationErrors(response: any): string[] {
    if (response.body.message && Array.isArray(response.body.message)) {
      return response.body.message;
    }
    return [];
  }
}
