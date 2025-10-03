import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesService } from './application/movies.service';
import { MoviesRepository } from './infrastructure/repositories/movies.typeorm.repository';
import { MoviesController } from './application/movies.controller';
import { Movie } from './infrastructure/entities/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie])],
  controllers: [MoviesController],
  providers: [MoviesService, MoviesRepository],
  exports: [MoviesService],
})
export class MoviesModule {}
