export interface SwapiFilm {
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

export interface SwapiResponse {
  result: {
    properties: SwapiFilm;
    uid: string;
  }[];
}

export interface SwapiFilmDetailResponse {
  result: {
    properties: SwapiFilm;
    uid: string;
  };
}
