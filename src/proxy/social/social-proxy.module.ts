import { Module } from '@nestjs/common';
import { SocialProxyController } from './controllers/social-proxy.controller';
import { ProfileProxyController } from './controllers/profile-proxy.controller';
import { FriendshipProxyController } from './controllers/friendship-proxy.controller';
import { FollowProxyController } from './controllers/follow-proxy.controller';
import { PostsProxyController } from './controllers/posts-proxy.controller';
import { CommentsProxyController } from './controllers/comments-proxy.controller';
import { ReelsProxyController } from './controllers/reels-proxy.controller';
import { HttpProxyService } from '../../common/services/http-proxy.service';

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
