import { Injectable } from '@nestjs/common';
import { ClerkBackendApi, ClerkOptions } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkService {
  private clerk: ClerkBackendApi;

  constructor(private readonly configService: ConfigService) {
    const clerkOptions: ClerkOptions = {
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
      publishableKey: this.configService.get('CLERK_PUBLISHABLE_KEY'),
      webhookSigningSecret: this.configService.get('CLERK_WEBHOOK_SECRET'),
    };

    this.clerk = new ClerkBackendApi(clerkOptions);
  }

  get users() {
    return this.clerk.users;
  }

  get sessions() {
    return this.clerk.sessions;
  }

  get webhooks() {
    return this.clerk.webhooks;
  }

  get emails() {
    return this.clerk.emails;
  }

  get phoneNumbers() {
    return this.clerk.phoneNumbers;
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.clerk.verifyToken(token);
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async createUser(userData: any) {
    return this.clerk.users.createUser(userData);
  }

  async updateUser(userId: string, updateData: any) {
    return this.clerk.users.updateUser(userId, updateData);
  }

  async getUser(userId: string) {
    return this.clerk.users.getUser(userId);
  }

  async deleteUser(userId: string) {
    return this.clerk.users.deleteUser(userId);
  }

  async createSession(sessionData: any) {
    return this.clerk.sessions.createSession(sessionData);
  }

  async revokeSession(sessionId: string) {
    return this.clerk.sessions.revokeSession(sessionId);
  }

  async verifyWebhookSignature(payload: string, signature: string) {
    return this.clerk.webhooks.verifyWebhookSignature({
      payload,
      signature,
    });
  }
}