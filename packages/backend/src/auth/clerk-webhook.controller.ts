import { Controller, Post, Body, Headers, HttpCode, HttpStatus, RawBody } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClerkService } from './clerk.provider';
import { ClerkAuthService } from './clerk.service';

@ApiTags('webhooks')
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(
    private readonly clerkService: ClerkService,
    private readonly clerkAuthService: ClerkAuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Clerk webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @RawBody() payload: string,
  ) {
    try {
      // Verify webhook signature
      const isValid = await this.clerkService.verifyWebhookSignature(
        payload,
        svixSignature,
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Parse the payload
      const event = JSON.parse(payload);

      // Handle the event
      await this.clerkAuthService.handleWebhook(event);

      return { success: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }
}