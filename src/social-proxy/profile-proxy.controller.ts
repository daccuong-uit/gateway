import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HttpProxyService } from '../common/services/http-proxy.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { appConfig } from '../config/app.config';
import { AccessTokenPayload } from '@platform/auth-sdk';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest {
  user: AccessTokenPayload;
}

@ApiTags('profiles')
@Controller('profiles')
export class ProfileProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Get(':userId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get profile header and stats by userId (Auth Account ID)' })
  getProfile(@Param('userId') userId: string, @Request() req: any) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}`, { headers });
  }

  @Get(':userId/profile-summary')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get profile summary for the profile page' })
  getProfileSummary(@Param('userId') userId: string, @Request() req: any) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/profile-summary`, { headers });
  }

  @Get(':userId/profile-insights')
  @ApiOperation({ summary: 'Get profile insights for the sidebar' })
  getProfileInsights(@Param('userId') userId: string) {
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/profile-insights`);
  }

  @Get(':userId/profile-tabs')
  @ApiOperation({ summary: 'Get list of profile tabs' })
  getProfileTabs(@Param('userId') userId: string) {
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/profile-tabs`);
  }

  @Get(':userId/profile-tabs/:tabId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get content for a profile tab' })
  getProfileTab(
    @Request() req: any,
    @Param('userId') userId: string,
    @Param('tabId') tabId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/profile-tabs/${tabId}${queryString ? `?${queryString}` : ''}`, {
      headers,
    });
  }

  @Put(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profile' })
  updateProfile(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}`, {
      body,
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Get(':userId/statistics/weekly')
  @ApiOperation({ summary: 'Get weekly statistics' })
  getWeeklyStatistics(@Param('userId') userId: string) {
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/statistics/weekly`);
  }

  @Get(':userId/reels')
  @ApiOperation({ summary: 'Get user reels' })
  getReels(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (limit) query.append('limit', limit);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/reels${queryString ? `?${queryString}` : ''}`);
  }

  @Get(':userId/stories')
  @ApiOperation({ summary: 'Get user stories' })
  getStories(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (limit) query.append('limit', limit);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/profiles/${userId}/stories${queryString ? `?${queryString}` : ''}`);
  }
}
