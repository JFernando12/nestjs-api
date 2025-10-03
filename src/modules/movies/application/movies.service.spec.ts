import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesRepository } from '../infrastructure/repositories/movies.typeorm.repository';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { PaginationDto } from '../../../common/dtos';
import { Movie } from '../domain/models/movie.model';

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: jest.Mocked<MoviesRepository>;

  const mockMovie: Movie = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Movie',
    director: 'Test Director',
    producer: 'Test Producer',
    release_date: new Date('2024-01-01'),
    opening_crawl: 'Test opening crawl...',
    episode_id: 1,
    swapi_id: '1',
    url: 'https://swapi.tech/api/films/1',
    characters: [],
    planets: [],
    starships: [],
    vehicles: [],
    species: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockMovies: Movie[] = [
    mockMovie,
    {
      ...mockMovie,
      id: '223e4567-e89b-12d3-a456-426614174000',
      title: 'Test Movie 2',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: MoviesRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findBySwapiId: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get(MoviesRepository);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'Test Movie',
        director: 'Test Director',
        producer: 'Test Producer',
        release_date: '2024-01-01',
        opening_crawl: 'Test opening crawl...',
        episode_id: 1,
      };
      repository.create.mockResolvedValue(mockMovie);

      const result = await service.create(createMovieDto);

      expect(repository.create).toHaveBeenCalledWith(createMovieDto);
      expect(result.message).toBe('Movie created successfully');
      expect(result.data).toEqual(mockMovie);
    });

    it('should handle repository errors', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'Test Movie',
        director: 'Test Director',
        producer: 'Test Producer',
        release_date: '2024-01-01',
        opening_crawl: 'Test opening crawl...',
        episode_id: 1,
      };
      repository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createMovieDto)).rejects.toThrow(
        'Database error',
      );
      expect(repository.create).toHaveBeenCalledWith(createMovieDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated movies with default pagination', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      repository.findAll.mockResolvedValue([mockMovies, mockMovies.length]);

      const result = await service.findAll(paginationDto);

      expect(repository.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result.data).toEqual(mockMovies);
      expect(result.meta.total).toBe(mockMovies.length);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should return paginated movies with custom pagination', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 5 };
      const totalMovies = 12;
      repository.findAll.mockResolvedValue([mockMovies, totalMovies]);

      const result = await service.findAll(paginationDto);

      expect(repository.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.total).toBe(totalMovies);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty array when no movies found', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      repository.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll(paginationDto);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a movie by id', async () => {
      const movieId = '123e4567-e89b-12d3-a456-426614174000';
      repository.findOne.mockResolvedValue(mockMovie);

      const result = await service.findOne(movieId);

      expect(repository.findOne).toHaveBeenCalledWith(movieId);
      expect(result.message).toBe('Movie retrieved successfully');
      expect(result.data).toEqual(mockMovie);
    });

    it('should throw NotFoundException when movie is not found', async () => {
      const movieId = 'non-existent-id';
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(movieId)).rejects.toThrow(
        new NotFoundException(`Movie with ID ${movieId} not found`),
      );
      expect(repository.findOne).toHaveBeenCalledWith(movieId);
    });
  });

  describe('update', () => {
    it('should update an existing movie', async () => {
      const movieId = '123e4567-e89b-12d3-a456-426614174000';
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie Title',
        director: 'Updated Director',
      };
      const updatedMovie: Movie = {
        ...mockMovie,
        title: 'Updated Movie Title',
        director: 'Updated Director',
      };

      repository.findOne.mockResolvedValue(mockMovie);
      repository.update.mockResolvedValue(updatedMovie);

      const result = await service.update(movieId, updateMovieDto);

      expect(repository.findOne).toHaveBeenCalledWith(movieId);
      expect(repository.update).toHaveBeenCalled();
      expect(result.message).toBe('Movie updated successfully');
      expect(result.data.title).toBe(updateMovieDto.title);
      expect(result.data.director).toBe(updateMovieDto.director);
    });

    it('should throw NotFoundException when updating non-existent movie', async () => {
      const movieId = 'non-existent-id';
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie Title',
      };
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(movieId, updateMovieDto)).rejects.toThrow(
        new NotFoundException(`Movie with ID ${movieId} not found`),
      );
      expect(repository.findOne).toHaveBeenCalledWith(movieId);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const movieId = '123e4567-e89b-12d3-a456-426614174000';
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Title Only',
      };
      const updatedMovie: Movie = { ...mockMovie, title: 'Updated Title Only' };

      repository.findOne.mockResolvedValue(mockMovie);
      repository.update.mockResolvedValue(updatedMovie);

      const result = await service.update(movieId, updateMovieDto);

      expect(result.data.title).toBe(updateMovieDto.title);
      expect(result.data.director).toBe(mockMovie.director);
    });
  });

  describe('remove', () => {
    it('should remove an existing movie', async () => {
      const movieId = '123e4567-e89b-12d3-a456-426614174000';
      repository.findOne.mockResolvedValue(mockMovie);
      repository.remove.mockResolvedValue(undefined);

      const result = await service.remove(movieId);

      expect(repository.findOne).toHaveBeenCalledWith(movieId);
      expect(repository.remove).toHaveBeenCalledWith(mockMovie);
      expect(result.message).toBe('Movie deleted successfully');
      expect(result.data).toEqual(mockMovie);
    });

    it('should throw NotFoundException when removing non-existent movie', async () => {
      const movieId = 'non-existent-id';
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(movieId)).rejects.toThrow(
        new NotFoundException(`Movie with ID ${movieId} not found`),
      );
      expect(repository.findOne).toHaveBeenCalledWith(movieId);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdate', () => {
    it('should create a new movie when swapi_id does not exist', async () => {
      const movieData: Partial<Movie> = {
        title: 'New Star Wars Movie',
        swapi_id: '999',
        director: 'New Director',
      };
      repository.findBySwapiId.mockResolvedValue(null);
      repository.save.mockResolvedValue({
        ...mockMovie,
        ...movieData,
      } as Movie);

      const result = await service.createOrUpdate(movieData);

      expect(repository.findBySwapiId).toHaveBeenCalledWith('999');
      expect(repository.save).toHaveBeenCalled();
      expect(result.title).toBe(movieData.title);
    });

    it('should update existing movie when swapi_id exists', async () => {
      const existingMovie = { ...mockMovie, swapi_id: '999' };
      const movieData: Partial<Movie> = {
        swapi_id: '999',
        title: 'Updated Title',
      };
      const updatedMovie: Movie = {
        ...existingMovie,
        title: 'Updated Title',
      };

      repository.findBySwapiId.mockResolvedValue(existingMovie);
      repository.save.mockResolvedValue(updatedMovie);

      const result = await service.createOrUpdate(movieData);

      expect(repository.findBySwapiId).toHaveBeenCalledWith('999');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Title' }),
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should create movie without swapi_id when not provided', async () => {
      const movieData: Partial<Movie> = {
        title: 'Custom Movie',
        director: 'Custom Director',
      };
      repository.save.mockResolvedValue({
        ...mockMovie,
        ...movieData,
      } as Movie);

      const result = await service.createOrUpdate(movieData);

      expect(repository.findBySwapiId).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.title).toBe(movieData.title);
    });
  });
});
