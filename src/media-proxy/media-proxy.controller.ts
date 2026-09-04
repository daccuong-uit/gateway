import { Controller, Post, Get, Delete, Param, Req, Body, Res, Query, UseGuards } from '@nestjs/common';
import { HttpProxyService } from '../common/services/http-proxy.service';
import { appConfig } from '../config/app.config';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiHeader, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('media')
@Controller('media')
export class MediaProxyController {
  constructor(private readonly proxy: HttpProxyService) {}


  @Post('presigned-upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned URL to upload a file directly to MinIO' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        fileSize: { type: 'number' },
      },
    },
  })
  async getPresignedUpload(@Body() body: any, @Req() req: any) {
    const userId = req.user?.sub || '00000000-0000-0000-0000-000000000000';
    return this.proxy.forward('POST', `${appConfig.MEDIA_SERVICE_URL}/media/presigned-upload`, {
      body: { ...body, userId },
      headers: {
        'x-user-id': userId,
      },
    });
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete a direct upload and start processing' })
  async completeUpload(@Param('id') id: string) {
    return this.proxy.forward('POST', `${appConfig.MEDIA_SERVICE_URL}/media/${id}/complete`);
  }


  @Get()
  @ApiOperation({ summary: 'List media items' })
  @ApiQuery({ name: 'userId', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, type: 'string', enum: ['pending', 'processing', 'ready', 'failed'] })
  @ApiQuery({ name: 'type', required: false, type: 'string', enum: ['image', 'video', 'audio', 'file'] })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async listMedia(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const url = new URL(`${appConfig.MEDIA_SERVICE_URL}/media`);
    if (userId) url.searchParams.set('userId', userId);
    if (status) url.searchParams.set('status', status);
    if (type) url.searchParams.set('type', type);
    if (page) url.searchParams.set('page', page);
    if (limit) url.searchParams.set('limit', limit);

    return this.proxy.forward('GET', url.toString());
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get media processing status' })
  async getStatus(@Param('id') id: string) {
    return this.proxy.forward('GET', `${appConfig.MEDIA_SERVICE_URL}/media/${id}/status`);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get media preview info' })
  async getPreview(@Param('id') id: string) {
    return this.proxy.forward('GET', `${appConfig.MEDIA_SERVICE_URL}/media/${id}/preview`);
  }

  @Post(':id/reprocess')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reprocess media file' })
  async reprocessMedia(@Param('id') id: string) {
    return this.proxy.forward('POST', `${appConfig.MEDIA_SERVICE_URL}/media/${id}/reprocess`);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Media Service health' })
  getHealth() {
    return this.proxy.forward('GET', `${appConfig.MEDIA_SERVICE_URL}/health`);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media metadata' })
  @ApiResponse({ status: 200, description: 'Media metadata' })
  async getMetadata(@Param('id') id: string) {
    return this.proxy.forward('GET', `${appConfig.MEDIA_SERVICE_URL}/media/${id}`);
  }

  @Get(':id/access')
  @ApiOperation({ summary: 'Get direct access URLs' })
  async getAccessUrls(@Param('id') id: string) {
    return this.proxy.forward('GET', `${appConfig.MEDIA_SERVICE_URL}/media/${id}/access`);
  }

  @Get(':id/info')
  @ApiOperation({ summary: 'Get detailed media info (metadata)' })
  async getInfo(@Param('id') id: string) {
    return this.proxy.forward('GET', `${appConfig.MEDIA_SERVICE_URL}/media/${id}/info`);
  }

  @Get(':id/hls/index.m3u8')
  @ApiOperation({ summary: 'Get HLS playlist' })
  async getHlsPlaylist(@Param('id') id: string, @Res() res: any) {
    return this.proxy.pipeForward(`${appConfig.MEDIA_SERVICE_URL}/media/${id}/hls/index.m3u8`, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  async deleteMedia(@Param('id') id: string) {
    return this.proxy.forward('DELETE', `${appConfig.MEDIA_SERVICE_URL}/media/${id}`);
  }
}
