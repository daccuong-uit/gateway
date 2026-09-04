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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reels')
@Controller('reels')
export class ReelsProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy Reel Feed cá nhân (người đang theo dõi)' })
  getFollowingFeed(@Query() query: any, @Request() req: any) {
    const qs = new URLSearchParams(query).toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/reels/feed${qs ? `?${qs}` : ''}`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Get('discover')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy Reel Feed khám phá (For You, Trending)' })
  getDiscoverFeed(@Query() query: any, @Request() req: any) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    const qs = new URLSearchParams(query).toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/reels/discover${qs ? `?${qs}` : ''}`, {
      headers,
    });
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách reels' })
  listReels(@Query() query: any, @Request() req: any) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    const qs = new URLSearchParams(query).toString();
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/reels${qs ? `?${qs}` : ''}`, {
      headers,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo reel mới' })
  createReel(@Body() body: any, @Request() req: any) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/reels`, {
      headers: { 'x-user-id': req.user.sub },
      body,
    });
  }

  @Get(':reelId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết một reel' })
  getById(@Param('reelId') reelId: string, @Request() req: any) {
    const headers: Record<string, string> = {};
    if (req.user?.sub) {
      headers['x-user-id'] = req.user.sub;
    }
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}`, {
      headers,
    });
  }

  @Put(':reelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật reel' })
  updateReel(@Param('reelId') reelId: string, @Body() body: any, @Request() req: any) {
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}`, {
      headers: { 'x-user-id': req.user.sub },
      body,
    });
  }

  @Delete(':reelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa reel' })
  deleteReel(@Param('reelId') reelId: string, @Request() req: any) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Post(':reelId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like reel' })
  likeReel(@Param('reelId') reelId: string, @Request() req: any) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}/like`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Delete(':reelId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike reel' })
  unlikeReel(@Param('reelId') reelId: string, @Request() req: any) {
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}/like`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }

  @Post(':reelId/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chia sẻ reel' })
  shareReel(@Param('reelId') reelId: string, @Body() body: any, @Request() req: any) {
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}/share`, {
      headers: { 'x-user-id': req.user.sub },
      body,
    });
  }

  @Get(':reelId/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analytics của reel' })
  getReelAnalytics(@Param('reelId') reelId: string, @Request() req: any) {
    return this.proxy.forward('GET', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}/analytics`, {
      headers: { 'x-user-id': req.user.sub },
    });
  }
}
