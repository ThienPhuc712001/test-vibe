import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { ClerkService } from './clerk.provider';
import { WebhookEvent, User as ClerkUser } from '@clerk/backend';

@Injectable()
export class ClerkAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly clerkService: ClerkService,
  ) {}

  async handleWebhook(event: WebhookEvent) {
    switch (event.type) {
      case 'user.created':
        await this.handleUserCreated(event.data);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event.data);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event.data);
        break;
      case 'session.created':
        await this.handleSessionCreated(event.data);
        break;
      case 'session.ended':
        await this.handleSessionEnded(event.data);
        break;
      case 'email.created':
        await this.handleEmailCreated(event.data);
        break;
      case 'phone.created':
        await this.handlePhoneCreated(event.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async handleUserCreated(clerkUser: ClerkUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (existingUser) {
      return;
    }

    // Create user in our database
    const user = await this.prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        avatar: clerkUser.imageUrl,
        emailVerified: !!clerkUser.emailAddresses[0]?.verification?.status,
        phoneVerified: !!clerkUser.phoneNumbers[0]?.verification?.status,
        role: this.determineUserRole(clerkUser),
        status: 'ACTIVE',
      },
    });

    // Create associated profile
    if (user.role === 'CUSTOMER') {
      await this.prisma.customer.create({
        data: { userId: user.id },
      });
    } else if (user.role === 'SELLER') {
      await this.prisma.seller.create({
        data: {
          userId: user.id,
          shopName: `${user.firstName}'s Shop`,
          commissionRate: 0.05,
        },
      });
    }

    // Create wallet
    await this.prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        frozenBalance: 0,
        currency: 'VND',
      },
    });

    console.log(`User created: ${user.id}`);
  }

  private async handleUserUpdated(clerkUser: ClerkUser) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: clerkUser.emailAddresses[0]?.emailAddress,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
        firstName: clerkUser.firstName || user.firstName,
        lastName: clerkUser.lastName || user.lastName,
        avatar: clerkUser.imageUrl || user.avatar,
        emailVerified: !!clerkUser.emailAddresses[0]?.verification?.status,
        phoneVerified: !!clerkUser.phoneNumbers[0]?.verification?.status,
        updatedAt: new Date(),
      },
    });

    console.log(`User updated: ${user.id}`);
  }

  private async handleUserDeleted(clerkUser: ClerkUser) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      return;
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    console.log(`User deleted: ${user.id}`);
  }

  private async handleSessionCreated(session: any) {
    // Update last login time
    await this.prisma.user.update({
      where: { clerkId: session.userId },
      data: { lastLoginAt: new Date() },
    });

    console.log(`Session created for user: ${session.userId}`);
  }

  private async handleSessionEnded(session: any) {
    console.log(`Session ended for user: ${session.userId}`);
  }

  private async handleEmailCreated(email: any) {
    console.log(`Email created: ${email.id}`);
  }

  private async handlePhoneCreated(phone: any) {
    console.log(`Phone created: ${phone.id}`);
  }

  private determineUserRole(clerkUser: ClerkUser): 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN' {
    // Check if user has admin metadata
    const metadata = clerkUser.publicMetadata || {};
    
    if (metadata.role === 'ADMIN') {
      return 'ADMIN';
    }
    
    if (metadata.role === 'SUPER_ADMIN') {
      return 'SUPER_ADMIN';
    }
    
    if (metadata.role === 'SELLER') {
      return 'SELLER';
    }
    
    // Default to customer
    return 'CUSTOMER';
  }

  async getUserByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        seller: {
          include: {
            shop: true,
          },
        },
        customer: true,
        wallet: true,
      },
    });
  }

  async syncUserWithClerk(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.clerkId) {
      return null;
    }

    try {
      const clerkUser = await this.clerkService.users.getUser(user.clerkId);
      
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || user.email,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || user.phone,
          firstName: clerkUser.firstName || user.firstName,
          lastName: clerkUser.lastName || user.lastName,
          avatar: clerkUser.imageUrl || user.avatar,
          emailVerified: !!clerkUser.emailAddresses[0]?.verification?.status,
          phoneVerified: !!clerkUser.phoneNumbers[0]?.verification?.status,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to sync user with Clerk:', error);
      return null;
    }
  }

  async updateUserRole(userId: string, role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update role in Clerk
    await this.clerkService.users.updateUser(user.clerkId, {
      publicMetadata: { role },
    });

    // Update role in our database
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async verifyKYC(userId: string, kycData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true },
    });

    if (!user || !user.seller) {
      throw new Error('Seller not found');
    }

    // Update seller KYC status
    await this.prisma.seller.update({
      where: { id: user.seller.id },
      data: {
        kycStatus: 'PENDING',
        kycDocuments: kycData,
        businessLicense: kycData.businessLicense,
        taxCode: kycData.taxCode,
      },
    });

    // Update user metadata in Clerk
    await this.clerkService.users.updateUser(user.clerkId, {
      publicMetadata: { 
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date().toISOString(),
      },
    });

    return { message: 'KYC documents submitted for review' };
  }
}