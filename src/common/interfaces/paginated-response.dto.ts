import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 50, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;

  @ApiProperty({ description: 'Array of items for the current page' })
  data: T[];

  constructor(data: T[], total: number, page: number, limit: number) {
    this.meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
    this.data = data;
  }
}
