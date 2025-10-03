import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    example: 'Operation successful',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  constructor(message: string, data: T) {
    this.message = message;
    this.data = data;
  }
}

export class CreatedResponseDto<T> extends ApiResponseDto<T> {
  constructor(data: T, message: string = 'Resource created successfully') {
    super(message, data);
  }
}

export class UpdatedResponseDto<T> extends ApiResponseDto<T> {
  constructor(data: T, message: string = 'Resource updated successfully') {
    super(message, data);
  }
}

export class DeletedResponseDto<T> extends ApiResponseDto<T> {
  constructor(data: T, message: string = 'Resource deleted successfully') {
    super(message, data);
  }
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}
