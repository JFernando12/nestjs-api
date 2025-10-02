import { Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StarWarsService } from './star-wars.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Star Wars')
@Controller('star-wars')
export class StarWarsController {
  constructor(private readonly starWarsService: StarWarsService) {}

  @Post('sync')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Synchronize movies from Star Wars API (Admin only)',
    description:
      'Fetches all Star Wars movies from SWAPI and creates/updates them in the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Movies synchronized successfully',
    schema: {
      example: {
        synchronized: 6,
        message: 'Successfully synchronized 6 movies from Star Wars API',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async syncMovies() {
    return this.starWarsService.syncMovies();
  }
}
