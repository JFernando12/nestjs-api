import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StarWarsService } from './application/star-wars.service';
import { StarWarsController } from './controllers/star-wars.controller';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('SWAPI_TIMEOUT')!,
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    MoviesModule,
  ],
  controllers: [StarWarsController],
  providers: [StarWarsService],
  exports: [StarWarsService],
})
export class StarWarsModule {}
