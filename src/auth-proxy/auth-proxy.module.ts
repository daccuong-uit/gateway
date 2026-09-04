import { Module } from '@nestjs/common';
import { AuthProxyController } from './auth-proxy.controller';
import { HttpProxyService } from '../common/services/http-proxy.service';

@Module({
  controllers: [AuthProxyController],
  providers: [HttpProxyService],
})
export class AuthProxyModule {}
