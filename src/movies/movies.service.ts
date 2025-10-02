import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const movie = this.moviesRepository.create(createMovieDto);
    return this.moviesRepository.save(movie);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Movie>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.moviesRepository.findAndCount({
      order: { episode_id: 'ASC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async findBySwapiId(swapiId: string): Promise<Movie | null> {
    return this.moviesRepository.findOne({ where: { swapi_id: swapiId } });
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);

    const updatedMovie = { ...movie, ...updateMovieDto };

    return this.moviesRepository.save(updatedMovie);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findOne(id);
    await this.moviesRepository.remove(movie);
  }

  async createOrUpdate(movieData: Partial<Movie>): Promise<Movie> {
    if (movieData.swapi_id) {
      const existing = await this.findBySwapiId(movieData.swapi_id);
      if (existing) {
        const updatedMovie = { ...existing, ...movieData };
        return this.moviesRepository.save(updatedMovie);
      }
    }

    const movie = this.moviesRepository.create(movieData);
    return this.moviesRepository.save(movie);
  }
}
