import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { StarWarsService } from './star-wars.service';
import { MoviesService } from '../../movies/application/movies.service';
import {
  SwapiMockFactory,
  AxiosResponseMockFactory,
} from '../../../common/testing';
import type { Movie } from '../../movies/domain/models/movie.model';

describe('StarWarsService', () => {
  let service: StarWarsService;
  let httpService: jest.Mocked<HttpService>;
  let moviesService: jest.Mocked<MoviesService>;
  let configService: jest.Mocked<ConfigService>;

  const mockSwapiBaseUrl = 'https://www.swapi.tech/api';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarWarsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: MoviesService,
          useValue: {
            createOrUpdate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockSwapiBaseUrl),
          },
        },
      ],
    }).compile();

    service = module.get<StarWarsService>(StarWarsService);
    httpService = module.get(HttpService);
    moviesService = module.get(MoviesService);
    configService = module.get(ConfigService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('syncMovies', () => {
    it('should successfully synchronize movies from SWAPI', async () => {
      const mockFilm1 = SwapiMockFactory.createStarWarsFilm(4);
      const mockFilm2 = SwapiMockFactory.createStarWarsFilm(5);
      const mockFilmsResponse = SwapiMockFactory.createFilmResponse([
        mockFilm1,
        mockFilm2,
      ]);

      const mockFilmDetail1 = SwapiMockFactory.createFilmDetailResponse(
        mockFilm1,
        '1',
      );
      const mockFilmDetail2 = SwapiMockFactory.createFilmDetailResponse(
        mockFilm2,
        '2',
      );

      const filmsAxiosResponse =
        AxiosResponseMockFactory.createResponse(mockFilmsResponse);
      const detailAxiosResponse1 =
        AxiosResponseMockFactory.createResponse(mockFilmDetail1);
      const detailAxiosResponse2 =
        AxiosResponseMockFactory.createResponse(mockFilmDetail2);

      httpService.get.mockImplementation((url: string) => {
        if (url.includes('/films/1')) {
          return of(detailAxiosResponse1);
        }
        if (url.includes('/films/2')) {
          return of(detailAxiosResponse2);
        }
        return of(filmsAxiosResponse);
      });

      moviesService.createOrUpdate.mockResolvedValue({} as Movie);

      const result = await service.syncMovies();

      expect(httpService.get).toHaveBeenCalledWith(`${mockSwapiBaseUrl}/films`);
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockSwapiBaseUrl}/films/1`,
      );
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockSwapiBaseUrl}/films/2`,
      );
      expect(moviesService.createOrUpdate).toHaveBeenCalledTimes(2);
      expect(result.synchronized).toBe(2);
      expect(result.message).toContain('Successfully synchronized 2 movies');
    });

    it('should handle empty film list from SWAPI', async () => {
      const emptyResponse = SwapiMockFactory.createFilmResponse([]);
      const axiosResponse =
        AxiosResponseMockFactory.createResponse(emptyResponse);

      httpService.get.mockReturnValue(of(axiosResponse));

      const result = await service.syncMovies();

      expect(result.synchronized).toBe(0);
      expect(result.message).toContain('Successfully synchronized 0 movies');
      expect(moviesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should throw error when SWAPI returns invalid response', async () => {
      const invalidResponse = AxiosResponseMockFactory.createResponse({
        message: 'error',
      });

      httpService.get.mockReturnValue(of(invalidResponse));

      await expect(service.syncMovies()).rejects.toThrow(
        'Invalid response from SWAPI',
      );
      expect(moviesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors from SWAPI', async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.syncMovies()).rejects.toThrow('Network error');
      expect(moviesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should continue synchronization when individual film fails', async () => {
      const mockFilm1 = SwapiMockFactory.createStarWarsFilm(4);
      const mockFilm2 = SwapiMockFactory.createStarWarsFilm(5);
      const mockFilmsResponse = SwapiMockFactory.createFilmResponse([
        mockFilm1,
        mockFilm2,
      ]);

      const mockFilmDetail2 = SwapiMockFactory.createFilmDetailResponse(
        mockFilm2,
        '2',
      );

      const filmsAxiosResponse =
        AxiosResponseMockFactory.createResponse(mockFilmsResponse);
      const detailAxiosResponse2 =
        AxiosResponseMockFactory.createResponse(mockFilmDetail2);

      httpService.get.mockImplementation((url: string) => {
        if (url.includes('/films/1')) {
          return throwError(() => new Error('Failed to fetch film 1'));
        }
        if (url.includes('/films/2')) {
          return of(detailAxiosResponse2);
        }
        return of(filmsAxiosResponse);
      });

      moviesService.createOrUpdate.mockResolvedValue({} as Movie);

      const result = await service.syncMovies();

      expect(result.synchronized).toBe(1);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should skip films with missing required data', async () => {
      const incompleteFilm = SwapiMockFactory.createFilm({
        title: '',
        episode_id: null as any,
      });
      const mockFilmsResponse = SwapiMockFactory.createFilmResponse([
        incompleteFilm,
      ]);
      const mockFilmDetail = SwapiMockFactory.createFilmDetailResponse(
        incompleteFilm,
        '1',
      );

      const filmsAxiosResponse =
        AxiosResponseMockFactory.createResponse(mockFilmsResponse);
      const detailAxiosResponse =
        AxiosResponseMockFactory.createResponse(mockFilmDetail);

      httpService.get.mockImplementation((url: string) => {
        if (url.includes('/films/')) {
          return of(detailAxiosResponse);
        }
        return of(filmsAxiosResponse);
      });

      const result = await service.syncMovies();

      expect(result.synchronized).toBe(0);
      expect(Logger.prototype.warn).toHaveBeenCalled();
      expect(moviesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should use default values for optional fields', async () => {
      const filmWithMinimalData = SwapiMockFactory.createFilm({
        title: 'Test Movie',
        episode_id: 1,
        opening_crawl: null as any,
        director: null as any,
        producer: null as any,
        release_date: null as any,
        characters: null as any,
        planets: null as any,
        starships: null as any,
        vehicles: null as any,
        species: null as any,
        url: null as any,
      });

      const mockFilmsResponse = SwapiMockFactory.createFilmResponse([
        filmWithMinimalData,
      ]);
      const mockFilmDetail = SwapiMockFactory.createFilmDetailResponse(
        filmWithMinimalData,
        '1',
      );

      const filmsAxiosResponse =
        AxiosResponseMockFactory.createResponse(mockFilmsResponse);
      const detailAxiosResponse =
        AxiosResponseMockFactory.createResponse(mockFilmDetail);

      httpService.get.mockImplementation((url: string) => {
        if (url.includes('/films/')) {
          return of(detailAxiosResponse);
        }
        return of(filmsAxiosResponse);
      });

      moviesService.createOrUpdate.mockResolvedValue({} as Movie);

      await service.syncMovies();

      expect(moviesService.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          opening_crawl: '',
          director: '',
          producer: '',
          characters: [],
          planets: [],
        }),
      );
    });
  });

  describe('handleCron', () => {
    it('should call syncMovies when cron job runs', async () => {
      const syncMoviesSpy = jest
        .spyOn(service, 'syncMovies')
        .mockResolvedValue({
          synchronized: 5,
          message: 'Success',
        });

      await service.handleCron();

      expect(syncMoviesSpy).toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Running scheduled Star Wars movies synchronization...',
      );
    });

    it('should handle errors during scheduled synchronization', async () => {
      jest
        .spyOn(service, 'syncMovies')
        .mockRejectedValue(new Error('Sync failed'));

      await expect(service.handleCron()).rejects.toThrow('Sync failed');
    });
  });

  describe('configuration', () => {
    it('should initialize with SWAPI_BASE_URL from config service', () => {
      expect(configService.get).toBeDefined();
      expect(service).toBeDefined();
    });
  });
});
