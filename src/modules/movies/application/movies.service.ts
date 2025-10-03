import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
  CreatedResponseDto,
  UpdatedResponseDto,
  DeletedResponseDto,
  ApiResponseDto,
} from '../../../common/dtos';
import { Movie } from '../domain/models/movie.model';
import { MoviesRepository } from '../infrastructure/repositories/movies.typeorm.repository';

@Injectable()
export class MoviesService {
  constructor(private moviesRepository: MoviesRepository) {}

  async create(
    createMovieDto: CreateMovieDto,
  ): Promise<CreatedResponseDto<Movie>> {
    const movie = await this.moviesRepository.create(createMovieDto);
    return new CreatedResponseDto(movie, 'Movie created successfully');
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Movie>> {
    const { page = 1, limit = 10 } = paginationDto;
    const [data, total] = await this.moviesRepository.findAll(paginationDto);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesRepository.findOne(id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return new ApiResponseDto('Movie retrieved successfully', movie);
  }

  async update(
    id: string,
    updateMovieDto: UpdateMovieDto,
  ): Promise<UpdatedResponseDto<Movie>> {
    const movie = await this.moviesRepository.findOne(id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    Object.assign(movie, updateMovieDto);

    const updatedMovie = await this.moviesRepository.update(movie);
    return new UpdatedResponseDto(updatedMovie, 'Movie updated successfully');
  }

  async remove(id: string): Promise<DeletedResponseDto<Movie>> {
    const movie = await this.moviesRepository.findOne(id);

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.moviesRepository.remove(movie);

    return new DeletedResponseDto(movie, 'Movie deleted successfully');
  }

  async createOrUpdate(movieData: Partial<Movie>): Promise<Movie> {
    if (movieData.swapi_id) {
      const existing = await this.moviesRepository.findBySwapiId(
        movieData.swapi_id,
      );
      if (existing) {
        Object.assign(existing, movieData);
        return this.moviesRepository.save(existing);
      }
    }

    const movie = new Movie(movieData);
    return this.moviesRepository.save(movie);
  }
}
