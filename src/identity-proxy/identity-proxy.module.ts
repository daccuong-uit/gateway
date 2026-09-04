import { Module } from '@nestjs/common';
import { IdentityProxyController } from './identity-proxy.controller';
import { HttpProxyService } from '../common/services/http-proxy.service';

@Module({
  controllers: [IdentityProxyController],
  providers: [HttpProxyService],
})
export class IdentityProxyModule {}
