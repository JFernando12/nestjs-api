import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { MoviesService } from '../movies/movies.service';

interface SwapiFilm {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  url: string;
  created: string;
  edited: string;
}

interface SwapiResponse {
  result: {
    properties: SwapiFilm;
    uid: string;
  }[];
}

@Injectable()
export class StarWarsService {
  private readonly logger = new Logger(StarWarsService.name);
  private readonly SWAPI_BASE_URL = 'https://www.swapi.tech/api';

  constructor(
    private readonly httpService: HttpService,
    private readonly moviesService: MoviesService,
  ) {}

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
            this.httpService.get(`${this.SWAPI_BASE_URL}/films/${filmData.uid}`),
          );

          const film = detailResponse.data.result.properties;

          await this.moviesService.createOrUpdate({
            title: film.title,
            episode_id: film.episode_id,
            opening_crawl: film.opening_crawl,
            director: film.director,
            producer: film.producer,
            release_date: new Date(film.release_date),
            characters: film.characters || [],
            planets: film.planets || [],
            starships: film.starships || [],
            vehicles: film.vehicles || [],
            species: film.species || [],
            url: film.url,
            swapi_id: filmData.uid,
          });

          syncCount++;
          this.logger.log(`Synchronized: ${film.title}`);
        } catch (error) {
          this.logger.error(`Failed to sync film ${filmData.uid}:`, error.message);
        }
      }

      this.logger.log(`Synchronization completed. Total synchronized: ${syncCount}`);
      
      return {
        synchronized: syncCount,
        message: `Successfully synchronized ${syncCount} movies from Star Wars API`,
      };
    } catch (error) {
      this.logger.error('Error during synchronization:', error.message);
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
