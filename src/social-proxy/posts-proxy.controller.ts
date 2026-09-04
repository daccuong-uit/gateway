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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('posts')
@Controller()
export class PostsProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  // ── Feed ──────────────────────────────────────────────────
  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy personal feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getPersonalFeed(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = req.user?.sub;
    const url = new URL(`${appConfig.SOCIAL_SERVICE_URL}/feed`);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);
    return this.proxy.forward('GET', url.toString(), {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Get('discover')
  @ApiOperation({ summary: 'Lấy discover feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filter', required: false, enum: ['trending', 'latest', 'for-you'] })
  getDiscoverFeed(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('filter') filter?: string,
  ) {
    const userId = req.user?.sub;
    const url = new URL(`${appConfig.SOCIAL_SERVICE_URL}/discover`);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);
    if (filter) url.searchParams.set('filter', filter);
    return this.proxy.forward('GET', url.toString(), {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  // ── Posts CRUD ────────────────────────────────────────────
  @Get('posts')
  @ApiOperation({ summary: 'Lấy danh sách posts (có filter)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiQuery({ name: 'hashtag', required: false, type: String })
  listPosts(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('authorId') authorId?: string,
    @Query('hashtag') hashtag?: string,
  ) {
    const userId = req.user?.sub;
    const url = new URL(`${appConfig.SOCIAL_SERVICE_URL}/posts`);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);
    if (authorId) url.searchParams.set('authorId', authorId);
    if (hashtag) url.searchParams.set('hashtag', hashtag);
    return this.proxy.forward('GET', url.toString(), {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo bài đăng mới' })
  @ApiResponse({ status: 201, description: 'Bài đăng đã được tạo' })
  createPost(@Body() body: any, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/posts`, {
      body,
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Lấy chi tiết bài đăng' })
  getPost(@Param('postId') postId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'GET',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}`,
      { headers: userId ? { 'x-user-id': userId } : {} },
    );
  }

  @Put('posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật bài đăng' })
  updatePost(
    @Param('postId') postId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'PUT',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}`,
      { body, headers: { 'x-user-id': userId } },
    );
  }

  @Delete('posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa bài đăng' })
  deletePost(@Param('postId') postId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'DELETE',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}`,
      { headers: { 'x-user-id': userId } },
    );
  }

  // ── Like / Unlike ──────────────────────────────────────────
  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like bài đăng' })
  likePost(@Param('postId') postId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'POST',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}/like`,
      { headers: { 'x-user-id': userId } },
    );
  }

  @Delete('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike bài đăng' })
  unlikePost(@Param('postId') postId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'DELETE',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}/like`,
      { headers: { 'x-user-id': userId } },
    );
  }

  // ── Share ──────────────────────────────────────────────────
  @Post('posts/:postId/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chia sẻ bài đăng' })
  sharePost(
    @Param('postId') postId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'POST',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}/share`,
      { body, headers: { 'x-user-id': userId } },
    );
  }

  // ── Report ──────────────────────────────────────────────────
  @Post('posts/:postId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Báo cáo bài đăng' })
  reportPost(
    @Param('postId') postId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const userId = req.user?.sub;
    return this.proxy.forward(
      'POST',
      `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}/report`,
      { body, headers: { 'x-user-id': userId } },
    );
  }
}
