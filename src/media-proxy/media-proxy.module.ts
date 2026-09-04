import { Module } from '@nestjs/common';
import { MediaProxyController } from './media-proxy.controller';
import { HttpProxyService } from '../common/services/http-proxy.service';

@Module({
  controllers: [MediaProxyController],
  providers: [HttpProxyService],
})
export class MediaProxyModule {}
