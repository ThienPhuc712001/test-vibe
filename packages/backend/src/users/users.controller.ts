import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  ChangePasswordDto,
} from './dto/users.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  async getAddresses(@Request() req) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  async createAddress(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.usersService.createAddress(req.user.id, createAddressDto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  async updateAddress(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.id, id, updateAddressDto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  async deleteAddress(@Request() req, @Param('id') id: string) {
    return this.usersService.deleteAddress(req.user.id, id);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get user wallet' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  async getWallet(@Request() req) {
    return this.usersService.getWallet(req.user.id);
  }

  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiResponse({ status: 200, description: 'Wallet transactions retrieved successfully' })
  async getWalletTransactions(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getWalletTransactions(req.user.id, page, limit);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getNotifications(req.user.id, page, limit);
  }

  @Put('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markNotificationAsRead(@Request() req, @Param('id') id: string) {
    return this.usersService.markNotificationAsRead(req.user.id, id);
  }

  @Put('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllNotificationsAsRead(@Request() req) {
    return this.usersService.markAllNotificationsAsRead(req.user.id);
  }

  @Delete('notifications/:id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return this.usersService.deleteNotification(req.user.id, id);
  }
}