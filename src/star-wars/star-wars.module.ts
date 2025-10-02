import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { StarWarsService } from './star-wars.service';
import { StarWarsController } from './star-wars.controller';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ScheduleModule.forRoot(),
    MoviesModule,
  ],
  controllers: [StarWarsController],
  providers: [StarWarsService],
  exports: [StarWarsService],
})
export class StarWarsModule {}
