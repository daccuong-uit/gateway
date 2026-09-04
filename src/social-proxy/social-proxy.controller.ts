import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

interface AuthenticatedRequest {
  user: AccessTokenPayload;
}

@ApiTags('users')
@Controller('users')
export class SocialProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  // ── User Profile (Public - Optional Auth) ────────────────
  @Get(':userId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}`, {
      headers,
    });
  }

  @Get(':userId/profile-summary')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile summary' })
  @ApiResponse({ status: 200, description: 'User profile summary' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfileSummary(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    return this.proxy.forward(
      'GET',
      `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/profile-summary`,
      { headers },
    );
  }

  @Get(':userId/profile-insights')
  @ApiOperation({ summary: 'Get user profile insights' })
  @ApiResponse({ status: 200, description: 'User profile insights' })
  getProfileInsights(@Param('userId') userId: string) {
    return this.proxy.forward(
      'GET',
      `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/profile-insights`,
    );
  }

  @Get(':userId/profile-tabs')
  @ApiOperation({ summary: 'Get user profile tabs list' })
  @ApiResponse({ status: 200, description: 'Profile tabs list' })
  getProfileTabs(@Param('userId') userId: string) {
    return this.proxy.forward(
      'GET',
      `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/profile-tabs`,
    );
  }

  @Get(':userId/profile-tabs/:tabId')
  @ApiOperation({ summary: 'Get user profile tab content' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Profile tab content' })
  getProfileTab(
    @Param('userId') userId: string,
    @Param('tabId') tabId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    const url = `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/profile-tabs/${tabId}${
      queryString ? `?${queryString}` : ''
    }`;
    return this.proxy.forward('GET', url);
  }

  // ── User Actions (Requires Auth) ────────────────────────
  @Put(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateProfile(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}`, {
      body,
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Post(':userId/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'User blocked' })
  blockUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/block`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Delete(':userId/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked' })
  unblockUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/block`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Post(':userId/mute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mute a user' })
  @ApiResponse({ status: 200, description: 'User muted' })
  muteUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/mute`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Delete(':userId/mute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unmute a user' })
  @ApiResponse({ status: 200, description: 'User unmuted' })
  unmuteUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/mute`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Post(':userId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a user' })
  @ApiResponse({ status: 200, description: 'User reported' })
  reportUser(
    @Param('userId') userId: string,
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/users/${userId}/report`, {
      body,
      headers: { 'x-user-id': req.user.sub },
    });
  }

  // ── My Account (Requires Auth) ──────────────────────────
  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user suggestions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User suggestions' })
  getSuggestions(
    @Query('limit') limit?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const userId = req?.user?.sub || '00000000-0000-0000-0000-000000000000';
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit);
    const queryString = query.toString();
    const url = `${appConfig.SOCIAL_SERVICE_URL}/users/suggestions${
      queryString ? `?${queryString}` : ''
    }`;
    return this.proxy.forward('GET', url, {
      headers: { 'x-user-id': userId },
    });
  }

  @Get('me/blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of blocked users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of blocked users' })
  getBlockedUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const userId = req?.user?.sub || '00000000-0000-0000-0000-000000000000';
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    const url = `${appConfig.SOCIAL_SERVICE_URL}/users/me/blocked${
      queryString ? `?${queryString}` : ''
    }`;
    return this.proxy.forward('GET', url, {
      headers: { 'x-user-id': userId },
    });
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of blocked users via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getBlockedUsersAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    const url = `${appConfig.SOCIAL_SERVICE_URL}/users/blocked${queryString ? `?${queryString}` : ''}`;
    return this.proxy.forward('GET', url, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('muted')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of muted users via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getMutedUsersAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    const url = `${appConfig.SOCIAL_SERVICE_URL}/users/muted${queryString ? `?${queryString}` : ''}`;
    return this.proxy.forward('GET', url, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('me/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings' })
  getPrivacySettings(@Request() req: AuthenticatedRequest) {
    const userId = req?.user?.sub || '00000000-0000-0000-0000-000000000000';
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/users/me/privacy`, {
      headers: { 'x-user-id': userId },
    });
  }

  @Put('me/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated' })
  updatePrivacySettings(
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/users/me/privacy`, {
      body,
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Get('me/account-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get account settings' })
  @ApiResponse({ status: 200, description: 'Account settings' })
  getAccountSettings(@Request() req: AuthenticatedRequest) {
    const userId = req?.user?.sub || '00000000-0000-0000-0000-000000000000';
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/users/me/account-settings`, {
      headers: { 'x-user-id': userId },
    });
  }

  // Removed friendship and follow endpoints to friendship-proxy.controller.ts and follow-proxy.controller.ts

  @Put('me/account-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update account settings' })
  @ApiResponse({ status: 200, description: 'Account settings updated' })
  updateAccountSettings(
    @Body() body: unknown,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/users/me/account-settings`, {
      body,
      headers: { 'x-user-id': req.user.sub },
    });
  }
}
