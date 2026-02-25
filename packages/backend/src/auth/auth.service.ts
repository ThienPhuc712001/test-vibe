import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { BcryptService } from './bcrypt.service';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import {
  RegisterDto,
  LoginDto,
  SocialLoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
  SendOtpDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly bcryptService: BcryptService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, password, firstName, lastName, role = UserRole.CUSTOMER } = registerDto;

    // Check if user already exists
    if (email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phone) {
      const existingUserByPhone = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existingUserByPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Hash password
    const hashedPassword = await this.bcryptService.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        status: UserStatus.ACTIVE,
      },
    });

    // Create customer or seller profile based on role
    if (role === UserRole.CUSTOMER) {
      await this.prisma.customer.create({
        data: {
          userId: user.id,
        },
      });
    } else if (role === UserRole.SELLER) {
      await this.prisma.seller.create({
        data: {
          userId: user.id,
          shopName: `${firstName}'s Shop`,
          commissionRate: 0.05, // 5% default commission
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

    // Send email verification if email provided
    if (email) {
      await this.sendEmailVerification(user.id, email);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, phone, password } = loginDto;

    // Find user by email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await this.bcryptService.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto) {
    const { provider, token } = socialLoginDto;

    // Verify social token (implementation depends on provider)
    let socialUser;
    try {
      if (provider === 'google') {
        socialUser = await this.verifyGoogleToken(token);
      } else if (provider === 'facebook') {
        socialUser = await this.verifyFacebookToken(token);
      } else if (provider === 'apple') {
        socialUser = await this.verifyAppleToken(token);
      } else {
        throw new BadRequestException('Invalid provider');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid social token');
    }

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: socialUser.email },
          { phone: socialUser.phone },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: socialUser.email,
          phone: socialUser.phone,
          firstName: socialUser.firstName,
          lastName: socialUser.lastName,
          avatar: socialUser.avatar,
          emailVerified: true,
          phoneVerified: !!socialUser.phone,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
      });

      // Create customer profile and wallet
      await this.prisma.customer.create({
        data: { userId: user.id },
      });

      await this.prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          frozenBalance: 0,
          currency: 'VND',
        },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email, phone } = forgotPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return { message: 'Password reset instructions sent' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    if (email) {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } else if (phone) {
      await this.otpService.sendOtp(phone, 'password_reset');
    }

    return { message: 'Password reset instructions sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await this.bcryptService.hash(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'email_verification') {
        throw new BadRequestException('Invalid token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update email verification status
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async verifyPhone(verifyPhoneDto: VerifyPhoneDto) {
    const { phone, otp } = verifyPhoneDto;

    const isValid = await this.otpService.verifyOtp(phone, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Update phone verification status
    await this.prisma.user.updateMany({
      where: { phone },
      data: { phoneVerified: true },
    });

    return { message: 'Phone verified successfully' };
  }

  async sendOtp(phone: string) {
    await this.otpService.sendOtp(phone, 'verification');
    return { message: 'OTP sent successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.bcryptService.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.bcryptService.hash(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async sendEmailVerification(userId: string, email: string) {
    const token = this.jwtService.sign(
      { sub: userId, type: 'email_verification' },
      { expiresIn: '24h' },
    );

    await this.emailService.sendEmailVerificationEmail(email, token);
  }

  private async verifyGoogleToken(token: string) {
    // Implementation for Google token verification
    // This would use Google's API to verify the token
    // For now, return mock data
    return {
      email: 'user@gmail.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://lh3.googleusercontent.com/...',
    };
  }

  private async verifyFacebookToken(token: string) {
    // Implementation for Facebook token verification
    // This would use Facebook's API to verify the token
    // For now, return mock data
    return {
      email: 'user@facebook.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://graph.facebook.com/...',
    };
  }

  private async verifyAppleToken(token: string) {
    // Implementation for Apple token verification
    // This would use Apple's API to verify the token
    // For now, return mock data
    return {
      email: 'user@icloud.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
    };
  }
}