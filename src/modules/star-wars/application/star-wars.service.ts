import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MoviesService } from '../../movies/application/movies.service';
import {
  SwapiResponse,
  SwapiFilmDetailResponse,
} from '../../../common/interfaces/swapi.types';

@Injectable()
export class StarWarsService {
  private readonly logger = new Logger(StarWarsService.name);
  private readonly SWAPI_BASE_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly moviesService: MoviesService,
    private readonly configService: ConfigService,
  ) {
    this.SWAPI_BASE_URL = this.configService.get<string>('SWAPI_BASE_URL')!;
  }

  async syncMovies(): Promise<{ synchronized: number; message: string }> {
    this.logger.log('Starting Star Wars movies synchronization...');

    try {
      // Get all films from SWAPI
      const response = await firstValueFrom(
        this.httpService.get<SwapiResponse>(`${this.SWAPI_BASE_URL}/films`),
      );

      if (!response.data || !response.data.result) {
        throw new Error('Invalid response from SWAPI');
      }

      const films = response.data.result;
      let syncCount = 0;

      for (const filmData of films) {
        try {
          // Get detailed information for each film
          const detailResponse = await firstValueFrom(
            this.httpService.get<SwapiFilmDetailResponse>(
              `${this.SWAPI_BASE_URL}/films/${filmData.uid}`,
            ),
          );

          const film = detailResponse.data.result.properties;

          // Validar que tenemos los datos necesarios
          if (!film.title || !film.episode_id) {
            this.logger.warn(`Missing required data for film ${filmData.uid}`);
            continue;
          }

          await this.moviesService.createOrUpdate({
            title: film.title,
            episode_id: film.episode_id,
            opening_crawl: film.opening_crawl || '',
            director: film.director || '',
            producer: film.producer || '',
            release_date: new Date(film.release_date || '1977-01-01'),
            characters: film.characters || [],
            planets: film.planets || [],
            starships: film.starships || [],
            vehicles: film.vehicles || [],
            species: film.species || [],
            url: film.url || '',
            swapi_id: filmData.uid,
          });

          syncCount++;
          this.logger.log(`Synchronized: ${film.title}`);
        } catch (error) {
          this.logger.error(
            `Failed to sync film ${filmData.uid}:`,
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      }

      this.logger.log(
        `Synchronization completed. Total synchronized: ${syncCount}`,
      );

      return {
        synchronized: syncCount,
        message: `Successfully synchronized ${syncCount} movies from Star Wars API`,
      };
    } catch (error) {
      this.logger.error(
        'Error during synchronization:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  // Run synchronization every day at 3 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.log('Running scheduled Star Wars movies synchronization...');
    await this.syncMovies();
  }
}
