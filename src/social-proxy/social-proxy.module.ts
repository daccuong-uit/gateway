import { Module } from '@nestjs/common';
import { SocialProxyController } from './social-proxy.controller';
import { ProfileProxyController } from './profile-proxy.controller';
import { FriendshipProxyController } from './friendship-proxy.controller';
import { FollowProxyController } from './follow-proxy.controller';
import { PostsProxyController } from './posts-proxy.controller';
import { CommentsProxyController } from './comments-proxy.controller';
import { ReelsProxyController } from './reels-proxy.controller';
import { HttpProxyService } from '../common/services/http-proxy.service';

@Module({
  controllers: [
    SocialProxyController,
    ProfileProxyController,
    FriendshipProxyController,
    FollowProxyController,
    PostsProxyController,
    CommentsProxyController,
    ReelsProxyController,
  ],
  providers: [HttpProxyService],
})
export class SocialProxyModule {}
