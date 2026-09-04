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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('comments')
@Controller()
export class CommentsProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Get('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách comment của một post' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  listComments(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.sub;
    const url = new URL(`${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}/comments`);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);

    return this.proxy.forward('GET', url.toString(), {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo comment mới cho post' })
  createComment(@Param('postId') postId: string, @Body() body: any, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/posts/${postId}/comments`, {
      body,
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Get('reels/:reelId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách comment của một reel' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  listReelComments(
    @Param('reelId') reelId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.sub;
    const url = new URL(`${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}/comments`);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);

    return this.proxy.forward('GET', url.toString(), {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Post('reels/:reelId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo comment mới cho reel' })
  createReelComment(@Param('reelId') reelId: string, @Body() body: any, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/reels/${reelId}/comments`, {
      body,
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Put('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật comment' })
  updateComment(@Param('commentId') commentId: string, @Body() body: any, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('PUT', `${appConfig.SOCIAL_SERVICE_URL}/comments/${commentId}`, {
      body,
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa comment' })
  deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/comments/${commentId}`, {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Get('comments/:commentId/replies')
  @ApiOperation({ summary: 'Lấy replies của một comment' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getReplies(
    @Param('commentId') commentId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.sub;
    const url = new URL(`${appConfig.SOCIAL_SERVICE_URL}/comments/${commentId}/replies`);
    if (page) url.searchParams.set('page', page);
    if (pageSize) url.searchParams.set('pageSize', pageSize);

    return this.proxy.forward('GET', url.toString(), {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thích comment' })
  likeComment(@Param('commentId') commentId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('POST', `${appConfig.SOCIAL_SERVICE_URL}/comments/${commentId}/like`, {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }

  @Delete('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bỏ thích comment' })
  unlikeComment(@Param('commentId') commentId: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.proxy.forward('DELETE', `${appConfig.SOCIAL_SERVICE_URL}/comments/${commentId}/like`, {
      headers: userId ? { 'x-user-id': userId } : {},
    });
  }
}
