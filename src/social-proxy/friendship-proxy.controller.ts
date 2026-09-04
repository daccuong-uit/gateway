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

@ApiTags('friendship')
@Controller('friendship')
export class FriendshipProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Get('friends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get friends via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getFriendsAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/friendship/friends${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get friend suggestions via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getSuggestionsAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/friendship/suggestions${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('requests/received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get received friend requests via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getReceivedRequestsAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/friendship/requests/received${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('requests/sent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sent friend requests via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getSentRequestsAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/friendship/requests/sent${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Get('relationships')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get relationships via FE route' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getRelationshipsAlias(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    const query = new URLSearchParams();
    if (page) query.append('page', page);
    if (pageSize) query.append('pageSize', pageSize);
    const queryString = query.toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/friendship/relationships${queryString ? `?${queryString}` : ''}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send friend request via FE route' })
  sendFriendRequestAlias(
    @Body() body: { targetUserId: string },
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/friendship/requests`, {
      body,
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Delete('requests/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel sent friend request via FE route' })
  cancelFriendRequestAlias(
    @Param('userId') userId: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/friendship/requests/${userId}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Delete('friends/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfriend via FE route' })
  unfriendAlias(
    @Param('userId') userId: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/friendship/friends/${userId}`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Put(':userId/relationship')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update friend relationship type via FE route' })
  updateRelationshipAlias(
    @Param('userId') userId: string,
    @Body() body: { type: string },
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/friendship/${userId}/relationship`, {
      body,
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Post('requests/:userId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept friend request via FE route' })
  acceptFriendRequestAlias(
    @Param('userId') userId: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/friendship/requests/${userId}/accept`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }

  @Post('requests/:userId/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline friend request via FE route' })
  declineFriendRequestAlias(
    @Param('userId') userId: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/friendship/requests/${userId}/decline`, {
      headers: { 'x-user-id': req?.user?.sub || '' },
    });
  }
}
