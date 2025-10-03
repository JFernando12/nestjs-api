import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({ example: 'A New Hope', description: 'Movie title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 4, description: 'Episode number', required: false })
  @IsOptional()
  @IsNumber()
  episode_id?: number;

  @ApiProperty({
    example: 'It is a period of civil war...',
    description: 'Opening crawl text',
  })
  @IsString()
  @IsNotEmpty()
  opening_crawl: string;

  @ApiProperty({ example: 'George Lucas', description: 'Director name' })
  @IsString()
  @IsNotEmpty()
  director: string;

  @ApiProperty({
    example: 'Gary Kurtz, Rick McCallum',
    description: 'Producer name(s)',
  })
  @IsString()
  @IsNotEmpty()
  producer: string;

  @ApiProperty({ example: '1977-05-25', description: 'Release date' })
  @IsDateString()
  @IsNotEmpty()
  release_date: string;

  @ApiProperty({
    example: ['Luke Skywalker', 'Darth Vader'],
    description: 'List of characters',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characters?: string[];

  @ApiProperty({
    example: ['Tatooine', 'Alderaan'],
    description: 'List of planets',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  planets?: string[];

  @ApiProperty({
    example: ['X-wing', 'TIE Fighter'],
    description: 'List of starships',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  starships?: string[];

  @ApiProperty({
    example: ['Snowspeeder'],
    description: 'List of vehicles',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicles?: string[];

  @ApiProperty({
    example: ['Human', 'Droid'],
    description: 'List of species',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  species?: string[];
}
