import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpProxyService } from '../../../common/services/http-proxy.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { appConfig } from '../../../config/app.config';
import type { UserPrincipal } from '../../auth/services/oidc-bff.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest {
  user: UserPrincipal;
}

@ApiTags('profiles')
@Controller('profiles')
export class IdentityProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a profile for the authenticated user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        displayName: { type: 'string' },
        bio: { type: 'string' },
        avatarUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Profile created' })
  createProfile(@Body() body: Record<string, unknown>) {
    return this.proxy.forward('POST', `${appConfig.IAM_SERVICE_URL}/profiles`, {
      body: { displayName: body.displayName },
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  getMyProfile() {
    return this.proxy.forward(
      'GET',
      `${appConfig.IAM_SERVICE_URL}/profiles/me`,
    );
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get profile by username' })
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  getProfileByUsername(@Param('username') username: string) {
    return this.proxy.forward(
      'GET',
      `${appConfig.IAM_SERVICE_URL}/profiles/username/${username}`,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get profile by User ID' })
  @ApiResponse({ status: 200, description: 'Returns profile data' })
  getProfileByUserId(@Param('userId') userId: string) {
    return this.proxy.forward(
      'GET',
      `${appConfig.IAM_SERVICE_URL}/profiles/user/${userId}`,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        displayName: { type: 'string' },
        bio: { type: 'string' },
        avatarUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateProfile(@Body() body: unknown, @Request() req: AuthenticatedRequest) {
    return this.proxy.forward(
      'PATCH',
      `${appConfig.IAM_SERVICE_URL}/profiles/user/${req.user.sub}`,
      { body },
    );
  }
}
