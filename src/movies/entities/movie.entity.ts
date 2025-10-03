import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  episode_id: number;

  @Column('text')
  opening_crawl: string;

  @Column()
  director: string;

  @Column()
  producer: string;

  @Column({ type: 'date' })
  release_date: Date;

  @Column('simple-array', { nullable: true })
  characters: string[];

  @Column('simple-array', { nullable: true })
  planets: string[];

  @Column('simple-array', { nullable: true })
  starships: string[];

  @Column('simple-array', { nullable: true })
  vehicles: string[];

  @Column('simple-array', { nullable: true })
  species: string[];

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  swapi_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
