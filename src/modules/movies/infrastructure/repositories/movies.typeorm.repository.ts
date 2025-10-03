import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie as MovieEntity } from '../entities/movie.entity';
import { Movie } from '../../domain/models/movie.model';
import { CreateMovieDto } from '../../application/dtos/create-movie.dto';
import { PaginationDto } from '../../../../common/interfaces/pagination.dto';
import { IMovieRepository } from '../../domain/repositories/movie.repository';

@Injectable()
export class MoviesRepository implements IMovieRepository {
  constructor(
    @InjectRepository(MovieEntity)
    private repository: Repository<MovieEntity>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const movie = this.repository.create(createMovieDto);
    return this.repository.save(movie);
  }

  async findAll(paginationDto: PaginationDto): Promise<[Movie[], number]> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    return this.repository.findAndCount({
      order: { episode_id: 'ASC', createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Movie | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySwapiId(swapiId: string): Promise<Movie | null> {
    return this.repository.findOne({ where: { swapi_id: swapiId } });
  }

  async update(movie: Movie): Promise<Movie> {
    return this.repository.save(movie);
  }

  async remove(movie: Movie): Promise<void> {
    await this.repository.remove(movie);
  }

  async save(movie: Movie): Promise<Movie> {
    return this.repository.save(movie);
  }
}
