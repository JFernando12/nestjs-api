export class Movie {
  id: string;
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: Date;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  url: string;
  swapi_id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Movie>) {
    Object.assign(this, partial);
  }
}
