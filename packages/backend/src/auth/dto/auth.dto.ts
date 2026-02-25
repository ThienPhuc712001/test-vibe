import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+84912345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+84912345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class SocialLoginDto {
  @ApiProperty({ enum: ['google', 'facebook', 'apple'], example: 'google' })
  @IsEnum(['google', 'facebook', 'apple'])
  provider: string;

  @ApiProperty({ example: 'ya29.a0AfH6SMC...' })
  @IsString()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+84912345678' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  token: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ example: '+84912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+84912345678' })
  @IsString()
  phone: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentpassword123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}