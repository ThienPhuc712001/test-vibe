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
import { NotificationsService } from './notifications.service';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  SendNotificationDto,
  BulkNotificationDto,
  MarkAsReadDto,
  NotificationQueryDto,
  NotificationSettingsDto,
  UpdateNotificationSettingsDto,
  PushTokenDto,
  RemovePushTokenDto,
  NotificationStatsDto,
  CampaignDto,
  SendCampaignDto
} from './dto/notifications.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Request() req,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('isRead') isRead?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const notificationQueryDto: NotificationQueryDto = {
      userId: req.user?.id,
      type: type as any,
      priority: priority as any,
      isRead,
      startDate,
      endDate,
      page,
      limit,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    };

    return this.notificationsService.getNotifications(notificationQueryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  async getNotificationById(@Param('id') id: string) {
    return this.notificationsService.getNotificationById(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update notification' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully' })
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.updateNotification(id, updateNotificationDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  @Post('send')
  @Roles('admin')
  @ApiOperation({ summary: 'Send notification to users' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }

  @Post('bulk')
  @Roles('admin')
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({ status: 201, description: 'Bulk notifications sent successfully' })
  async sendBulkNotifications(@Body() bulkNotificationDto: BulkNotificationDto) {
    return this.notificationsService.sendBulkNotifications(bulkNotificationDto);
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read successfully' })
  async markAsRead(@Request() req, @Body() markAsReadDto: MarkAsReadDto) {
    return this.notificationsService.markAsRead(markAsReadDto);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  async getNotificationSettings(@Request() req) {
    return this.notificationsService.getNotificationSettings(req.user?.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  async updateNotificationSettings(
    @Request() req,
    @Body() updateNotificationSettingsDto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateNotificationSettings(
      req.user?.id,
      updateNotificationSettingsDto,
    );
  }

  @Post('register-token')
  @ApiOperation({ summary: 'Register push notification token' })
  @ApiResponse({ status: 201, description: 'Push token registered successfully' })
  async registerPushToken(@Request() req, @Body() pushTokenDto: PushTokenDto) {
    return this.notificationsService.registerPushToken({
      ...pushTokenDto,
      userId: pushTokenDto.userId || req.user?.id,
    });
  }

  @Delete('remove-token')
  @ApiOperation({ summary: 'Remove push notification token' })
  @ApiResponse({ status: 200, description: 'Push token removed successfully' })
  async removePushToken(@Request() req, @Body() removePushTokenDto: RemovePushTokenDto) {
    return this.notificationsService.removePushToken({
      ...removePushTokenDto,
      userId: removePushTokenDto.userId || req.user?.id,
    });
  }

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification statistics retrieved successfully' })
  async getNotificationStats(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('channel') channel?: string,
  ) {
    const notificationStatsDto: NotificationStatsDto = {
      userId,
      startDate,
      endDate,
      type: type as any,
      channel: channel as any,
    };

    return this.notificationsService.getNotificationStats(notificationStatsDto);
  }

  @Post('campaigns')
  @Roles('admin')
  @ApiOperation({ summary: 'Create notification campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async createCampaign(@Body() campaignDto: CampaignDto) {
    // This would create a campaign in the database
    // For now, returning a mock response
    return {
      id: `campaign_${Date.now()}`,
      ...campaignDto,
      status: 'created',
      createdAt: new Date(),
    };
  }

  @Get('campaigns')
  @Roles('admin')
  @ApiOperation({ summary: 'Get notification campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async getCampaigns(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    // This would retrieve campaigns from the database
    // For now, returning a mock response
    return {
      campaigns: [],
      pagination: {
        page: page || 1,
        limit: limit || 20,
        total: 0,
        totalPages: 0,
      },
    };
  }

  @Post('campaigns/:id/send')
  @Roles('admin')
  @ApiOperation({ summary: 'Send notification campaign' })
  @ApiResponse({ status: 200, description: 'Campaign sent successfully' })
  async sendCampaign(
    @Param('id') id: string,
    @Body() sendCampaignDto: SendCampaignDto,
  ) {
    // This would send the campaign to target users
    // For now, returning a mock response
    return {
      campaignId: id,
      status: 'sent',
      sentAt: new Date(),
      totalSent: 0,
      testMode: sendCampaignDto.testMode,
    };
  }

  @Post('process-scheduled')
  @Roles('admin')
  @ApiOperation({ summary: 'Process scheduled notifications' })
  @ApiResponse({ status: 200, description: 'Scheduled notifications processed successfully' })
  async processScheduledNotifications() {
    return this.notificationsService.processScheduledNotifications();
  }

  @Post('cleanup')
  @Roles('admin')
  @ApiOperation({ summary: 'Clean up old notifications' })
  @ApiResponse({ status: 200, description: 'Old notifications cleaned up successfully' })
  async cleanupOldNotifications() {
    return this.notificationsService.cleanupOldNotifications();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user\'s notifications' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  async getMyNotifications(
    @Request() req,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('isRead') isRead?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const notificationQueryDto: NotificationQueryDto = {
      userId: req.user?.id,
      type: type as any,
      priority: priority as any,
      isRead,
      startDate,
      endDate,
      page,
      limit,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    };

    return this.notificationsService.getNotifications(notificationQueryDto);
  }

  @Post('my/mark-read')
  @ApiOperation({ summary: 'Mark current user\'s notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read successfully' })
  async markMyNotificationsAsRead(
    @Request() req,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    return this.notificationsService.markAsRead(markAsReadDto);
  }

  @Get('my/settings')
  @ApiOperation({ summary: 'Get current user\'s notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  async getMyNotificationSettings(@Request() req) {
    return this.notificationsService.getNotificationSettings(req.user?.id);
  }

  @Put('my/settings')
  @ApiOperation({ summary: 'Update current user\'s notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  async updateMyNotificationSettings(
    @Request() req,
    @Body() updateNotificationSettingsDto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateNotificationSettings(
      req.user?.id,
      updateNotificationSettingsDto,
    );
  }

  @Post('my/register-token')
  @ApiOperation({ summary: 'Register push notification token for current user' })
  @ApiResponse({ status: 201, description: 'Push token registered successfully' })
  async registerMyPushToken(
    @Request() req,
    @Body() pushTokenDto: PushTokenDto,
  ) {
    return this.notificationsService.registerPushToken({
      ...pushTokenDto,
      userId: pushTokenDto.userId || req.user?.id,
    });
  }

  @Delete('my/remove-token')
  @ApiOperation({ summary: 'Remove push notification token for current user' })
  @ApiResponse({ status: 200, description: 'Push token removed successfully' })
  async removeMyPushToken(
    @Request() req,
    @Body() removePushTokenDto: RemovePushTokenDto,
  ) {
    return this.notificationsService.removePushToken({
      ...removePushTokenDto,
      userId: removePushTokenDto.userId || req.user?.id,
    });
  }
}