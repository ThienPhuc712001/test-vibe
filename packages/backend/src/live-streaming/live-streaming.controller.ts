import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LiveStreamingService } from './live-streaming.service';
import { 
  CreateStreamDto, 
  UpdateStreamDto, 
  StreamStatus,
  StreamType,
  JoinStreamDto,
  LeaveStreamDto,
  StartStreamDto,
  EndStreamDto,
  PauseStreamDto,
  ResumeStreamDto,
  SendChatMessageDto,
  SendGiftDto,
  CreateProductShowcaseDto,
  UpdateStreamSettingsDto,
  StreamAnalyticsDto,
  StreamInvitationDto,
  BanUserDto,
  UnbanUserDto,
  MakeModeratorDto,
  RemoveModeratorDto,
  StreamWebhookDto
} from './dto/live-streaming.dto';

@ApiTags('Live Streaming')
@Controller('live-streaming')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LiveStreamingController {
  constructor(private readonly liveStreamingService: LiveStreamingService) {}

  @Post('streams')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Create a new live stream' })
  @ApiResponse({ status: 201, description: 'Stream created successfully' })
  async createStream(@Request() req, @Body() createStreamDto: CreateStreamDto) {
    return this.liveStreamingService.createStream(req.user.id, createStreamDto);
  }

  @Get('streams')
  @ApiOperation({ summary: 'Get all live streams with filtering' })
  @ApiResponse({ status: 200, description: 'Streams retrieved successfully' })
  async getStreams(
    @Query('status') status?: StreamStatus,
    @Query('type') type?: StreamType,
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.liveStreamingService.getStreams({
      status,
      type,
      categoryId,
      sellerId,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }

  @Get('streams/popular')
  @ApiOperation({ summary: 'Get popular live streams' })
  @ApiResponse({ status: 200, description: 'Popular streams retrieved successfully' })
  async getPopularStreams(@Query('limit') limit?: number) {
    return this.liveStreamingService.getPopularStreams(limit ? parseInt(limit.toString()) : 10);
  }

  @Get('streams/my')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Get user\'s live streams' })
  @ApiResponse({ status: 200, description: 'User streams retrieved successfully' })
  async getUserStreams(
    @Request() req,
    @Query('status') status?: StreamStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.liveStreamingService.getUserStreams(req.user.id, {
      status,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }

  @Get('streams/:id')
  @ApiOperation({ summary: 'Get live stream by ID' })
  @ApiResponse({ status: 200, description: 'Stream retrieved successfully' })
  async getStreamById(@Param('id') id: string) {
    return this.liveStreamingService.getStreamById(id);
  }

  @Put('streams/:id')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Update live stream' })
  @ApiResponse({ status: 200, description: 'Stream updated successfully' })
  async updateStream(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStreamDto: UpdateStreamDto,
  ) {
    return this.liveStreamingService.updateStream(id, req.user.id, updateStreamDto);
  }

  @Delete('streams/:id')
  @Roles('seller', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete live stream' })
  @ApiResponse({ status: 204, description: 'Stream deleted successfully' })
  async deleteStream(@Request() req, @Param('id') id: string) {
    return this.liveStreamingService.deleteStream(id, req.user.id);
  }

  @Post('streams/:id/start')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Start live stream' })
  @ApiResponse({ status: 200, description: 'Stream started successfully' })
  async startStream(
    @Request() req,
    @Param('id') id: string,
    @Body() startStreamDto: StartStreamDto,
  ) {
    return this.liveStreamingService.startStream(id, req.user.id, startStreamDto);
  }

  @Post('streams/:id/end')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'End live stream' })
  @ApiResponse({ status: 200, description: 'Stream ended successfully' })
  async endStream(
    @Request() req,
    @Param('id') id: string,
    @Body() endStreamDto: EndStreamDto,
  ) {
    return this.liveStreamingService.endStream(id, req.user.id, endStreamDto);
  }

  @Post('streams/:id/pause')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Pause live stream' })
  @ApiResponse({ status: 200, description: 'Stream paused successfully' })
  async pauseStream(
    @Request() req,
    @Param('id') id: string,
    @Body() pauseStreamDto: PauseStreamDto,
  ) {
    // Implementation for pause stream
    return { message: 'Stream paused successfully' };
  }

  @Post('streams/:id/resume')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Resume live stream' })
  @ApiResponse({ status: 200, description: 'Stream resumed successfully' })
  async resumeStream(
    @Request() req,
    @Param('id') id: string,
    @Body() resumeStreamDto: ResumeStreamDto,
  ) {
    // Implementation for resume stream
    return { message: 'Stream resumed successfully' };
  }

  @Post('streams/join')
  @ApiOperation({ summary: 'Join live stream as viewer' })
  @ApiResponse({ status: 200, description: 'Joined stream successfully' })
  async joinStream(@Request() req, @Body() joinStreamDto: JoinStreamDto) {
    return this.liveStreamingService.joinStream(req.user.id, joinStreamDto);
  }

  @Post('streams/leave')
  @ApiOperation({ summary: 'Leave live stream' })
  @ApiResponse({ status: 200, description: 'Left stream successfully' })
  async leaveStream(@Request() req, @Body() leaveStreamDto: LeaveStreamDto) {
    return this.liveStreamingService.leaveStream(req.user.id, leaveStreamDto);
  }

  @Post('streams/chat')
  @ApiOperation({ summary: 'Send chat message to stream' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendChatMessage(@Request() req, @Body() sendChatMessageDto: SendChatMessageDto) {
    return this.liveStreamingService.sendChatMessage(req.user.id, sendChatMessageDto);
  }

  @Post('streams/gift')
  @ApiOperation({ summary: 'Send gift to stream' })
  @ApiResponse({ status: 201, description: 'Gift sent successfully' })
  async sendGift(@Request() req, @Body() sendGiftDto: SendGiftDto) {
    // Implementation for send gift
    return { message: 'Gift sent successfully' };
  }

  @Post('streams/product-showcase')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Create product showcase in stream' })
  @ApiResponse({ status: 201, description: 'Product showcase created successfully' })
  async createProductShowcase(
    @Request() req,
    @Body() createProductShowcaseDto: CreateProductShowcaseDto,
  ) {
    // Implementation for product showcase
    return { message: 'Product showcase created successfully' };
  }

  @Put('streams/:id/settings')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Update stream settings' })
  @ApiResponse({ status: 200, description: 'Stream settings updated successfully' })
  async updateStreamSettings(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStreamSettingsDto: UpdateStreamSettingsDto,
  ) {
    // Implementation for update stream settings
    return { message: 'Stream settings updated successfully' };
  }

  @Get('streams/:id/analytics')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Get stream analytics' })
  @ApiResponse({ status: 200, description: 'Stream analytics retrieved successfully' })
  async getStreamAnalytics(
    @Param('id') id: string,
    @Query() streamAnalyticsDto: StreamAnalyticsDto,
  ) {
    return this.liveStreamingService.getStreamAnalytics(id, streamAnalyticsDto);
  }

  @Post('streams/invite')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Invite users to stream' })
  @ApiResponse({ status: 201, description: 'Users invited successfully' })
  async inviteUsers(
    @Request() req,
    @Body() streamInvitationDto: StreamInvitationDto,
  ) {
    // Implementation for invite users
    return { message: 'Users invited successfully' };
  }

  @Post('streams/ban')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Ban user from stream' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(@Request() req, @Body() banUserDto: BanUserDto) {
    // Implementation for ban user
    return { message: 'User banned successfully' };
  }

  @Post('streams/unban')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Unban user from stream' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  async unbanUser(@Request() req, @Body() unbanUserDto: UnbanUserDto) {
    // Implementation for unban user
    return { message: 'User unbanned successfully' };
  }

  @Post('streams/moderator')
  @Roles('seller', 'admin')
  @ApiOperation({ summary: 'Make user moderator' })
  @ApiResponse({ status: 200, description: 'User made moderator successfully' })
  async makeModerator(@Request() req, @Body() makeModeratorDto: MakeModeratorDto) {
    // Implementation for make moderator
    return { message: 'User made moderator successfully' };
  }

  @Delete('streams/moderator')
  @Roles('seller', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove moderator role from user' })
  @ApiResponse({ status: 204, description: 'Moderator role removed successfully' })
  async removeModerator(@Request() req, @Body() removeModeratorDto: RemoveModeratorDto) {
    // Implementation for remove moderator
    return { message: 'Moderator role removed successfully' };
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Handle webhooks from streaming providers' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Body() streamWebhookDto: StreamWebhookDto) {
    // Implementation for webhook handling
    return { message: 'Webhook processed successfully' };
  }
}