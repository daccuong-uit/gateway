import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HttpProxyService } from '../common/services/http-proxy.service';
import { appConfig } from '../config/app.config';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthProxyController {
  constructor(private readonly proxy: HttpProxyService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        username: { type: 'string' },
        displayName: { type: 'string' },
        phoneNumber: { type: 'string' },
        otp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() body: any) {
    // 1. Create authentication account
    const authResponse = await this.proxy.forward<any>('POST', `${appConfig.AUTH_SERVICE_URL}/auth/register`, {
      body: {
        email: body.email,
        password: body.password,
        username: body.username,
        displayName: body.displayName,
        phoneNumber: body.phoneNumber,
        otp: body.otp,
      },
    });

    // 2. Create identity profile
    try {
      await this.proxy.forward('POST', `${appConfig.IDENTITY_SERVICE_URL}/profiles`, {
        body: {
          userId: authResponse.accountId,
          username: body.username,
          displayName: body.displayName,
        },
      });
    } catch (err) {
      console.error('[gateway] Failed to create profile for user', authResponse.accountId, err);
    }

    return authResponse;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        phoneNumber: { type: 'string' },
        otp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  login(@Body() body: unknown) {
    return this.proxy.forward('POST', `${appConfig.AUTH_SERVICE_URL}/auth/login`, { body });
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for phone number' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['phoneNumber'],
      properties: {
        phoneNumber: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  sendOtp(@Body() body: unknown) {
    return this.proxy.forward('POST', `${appConfig.AUTH_SERVICE_URL}/auth/send-otp`, { body });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  refresh(@Body() body: unknown) {
    return this.proxy.forward('POST', `${appConfig.AUTH_SERVICE_URL}/auth/refresh`, { body });
  }
}
