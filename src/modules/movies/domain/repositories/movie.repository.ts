import { Movie } from '../models/movie.model';
import { CreateMovieDto } from '../../../movies/application/dtos/create-movie.dto';
import { PaginationDto } from '../../../../common/interfaces/pagination.dto';

export interface IMovieRepository {
  create(createMovieDto: CreateMovieDto): Promise<Movie>;
  findAll(paginationDto: PaginationDto): Promise<[Movie[], number]>;
  findOne(id: string): Promise<Movie | null>;
  findBySwapiId(swapiId: string): Promise<Movie | null>;
  update(movie: Movie): Promise<Movie>;
  remove(movie: Movie): Promise<void>;
  save(movie: Movie): Promise<Movie>;
}

export const MOVIE_REPOSITORY = Symbol('MOVIE_REPOSITORY');
