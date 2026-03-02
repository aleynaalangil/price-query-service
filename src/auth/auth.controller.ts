import { Controller, Get } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('v1/auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Get('token')
  @ApiOperation({ summary: 'Get a valid dummy JWT token' })
  @ApiResponse({ status: 200, description: 'Return a JWT token.' })
  getToken() {
    const payload = { username: 'testuser', sub: 1 };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
