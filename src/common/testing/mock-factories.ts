import { UserRole } from '../interfaces';
import { User } from '../../modules/users/domain/models/user.model';
import { Movie } from '../../modules/movies/domain/models/movie.model';
import type {
  SwapiFilm,
  SwapiResponse,
  SwapiFilmDetailResponse,
} from '../interfaces/swapi.types';
import type { AxiosResponse } from 'axios';

export class UserMockFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    };
  }

  static createAdmin(overrides?: Partial<User>): User {
    return UserMockFactory.createUser({
      id: '223e4567-e89b-12d3-a456-426614174000',
      username: 'adminuser',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      ...overrides,
    });
  }

  static createUsers(count: number): User[] {
    return Array.from({ length: count }, (_, index) =>
      UserMockFactory.createUser({
        id: `user-${index}`,
        username: `testuser${index}`,
        email: `test${index}@example.com`,
      }),
    );
  }
}

export class MovieMockFactory {
  static createMovie(overrides?: Partial<Movie>): Movie {
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Movie',
      episode_id: 1,
      opening_crawl: 'Test opening crawl...',
      director: 'Test Director',
      producer: 'Test Producer',
      release_date: new Date('2024-01-01'),
      characters: ['https://swapi.tech/api/people/1'],
      planets: ['https://swapi.tech/api/planets/1'],
      starships: ['https://swapi.tech/api/starships/1'],
      vehicles: ['https://swapi.tech/api/vehicles/1'],
      species: ['https://swapi.tech/api/species/1'],
      url: 'https://swapi.tech/api/films/1',
      swapi_id: '1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    };
  }

  static createMovies(count: number): Movie[] {
    return Array.from({ length: count }, (_, index) =>
      MovieMockFactory.createMovie({
        id: `movie-${index}`,
        title: `Test Movie ${index + 1}`,
        episode_id: index + 1,
        swapi_id: `${index + 1}`,
      }),
    );
  }

  static createStarWarsMovie(episode: number): Movie {
    const starWarsMovies = [
      {
        title: 'A New Hope',
        episode_id: 4,
        director: 'George Lucas',
        release_date: new Date('1977-05-25'),
      },
      {
        title: 'The Empire Strikes Back',
        episode_id: 5,
        director: 'Irvin Kershner',
        release_date: new Date('1980-05-21'),
      },
      {
        title: 'Return of the Jedi',
        episode_id: 6,
        director: 'Richard Marquand',
        release_date: new Date('1983-05-25'),
      },
    ];

    const movieData = starWarsMovies[episode - 4] || starWarsMovies[0];
    return MovieMockFactory.createMovie(movieData);
  }
}

export class JwtPayloadMockFactory {
  static createPayload(overrides?: any) {
    return {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser',
      email: 'test@example.com',
      role: UserRole.USER,
      ...overrides,
    };
  }

  static createAdminPayload(overrides?: any) {
    return JwtPayloadMockFactory.createPayload({
      sub: '223e4567-e89b-12d3-a456-426614174000',
      username: 'adminuser',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      ...overrides,
    });
  }
}

export class AxiosResponseMockFactory {
  static createResponse<T>(data: T, overrides?: any): AxiosResponse<T> {
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} as any } as any,
      ...overrides,
    } as AxiosResponse<T>;
  }

  static createErrorResponse(status: number, message: string) {
    return {
      data: { message },
      status,
      statusText: message,
      headers: {},
      config: { headers: {} as any } as any,
    };
  }
}

export class SwapiMockFactory {
  static createFilm(overrides?: Partial<SwapiFilm>): SwapiFilm {
    return {
      title: 'Test Film',
      episode_id: 1,
      opening_crawl: 'Test opening crawl...',
      director: 'Test Director',
      producer: 'Test Producer',
      release_date: '2024-01-01',
      characters: ['https://swapi.tech/api/people/1'],
      planets: ['https://swapi.tech/api/planets/1'],
      starships: ['https://swapi.tech/api/starships/1'],
      vehicles: ['https://swapi.tech/api/vehicles/1'],
      species: ['https://swapi.tech/api/species/1'],
      url: 'https://swapi.tech/api/films/1',
      created: '2014-12-10T14:23:31.880000Z',
      edited: '2014-12-20T19:49:45.256000Z',
      ...overrides,
    };
  }

  static createFilmResponse(films: SwapiFilm[]): SwapiResponse {
    return {
      result: films.map((film, index) => ({
        properties: film,
        uid: String(index + 1),
      })),
    };
  }

  static createFilmDetailResponse(
    film: SwapiFilm,
    uid: string = '1',
  ): SwapiFilmDetailResponse {
    return {
      result: {
        properties: film,
        uid,
      },
    };
  }

  static createStarWarsFilm(episode: number): SwapiFilm {
    const films = [
      {
        title: 'A New Hope',
        episode_id: 4,
        director: 'George Lucas',
        release_date: '1977-05-25',
        opening_crawl: 'It is a period of civil war...',
      },
      {
        title: 'The Empire Strikes Back',
        episode_id: 5,
        director: 'Irvin Kershner',
        release_date: '1980-05-21',
        opening_crawl: 'It is a dark time for the Rebellion...',
      },
      {
        title: 'Return of the Jedi',
        episode_id: 6,
        director: 'Richard Marquand',
        release_date: '1983-05-25',
        opening_crawl: 'Luke Skywalker has returned...',
      },
    ];

    const filmData = films.find((f) => f.episode_id === episode) || films[0];
    return SwapiMockFactory.createFilm(filmData);
  }
}
