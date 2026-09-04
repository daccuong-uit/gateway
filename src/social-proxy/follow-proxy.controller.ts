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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { appConfig } from '../config/app.config';
import { AccessTokenPayload } from '@platform/auth-sdk';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

interface AuthenticatedRequest {
  user: AccessTokenPayload;
}

@ApiTags('follow')
@Controller('follow')
export class FollowProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow via FE route' })
  followAlias(
    @Body() body: { targetUserId: string },
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/follow`, {
      body,
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Post('unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow via FE route' })
  unfollowAlias(
    @Body() body: { targetUserId: string },
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/follow/unfollow`, {
      body,
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get followers via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getFollowersAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/follow/followers${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get following via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getFollowingAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/follow/following${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Delete('followers/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa người theo dõi via FE route' })
  removeFollower(
    @Param('userId') userId: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/follow/followers/${userId}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }
}
