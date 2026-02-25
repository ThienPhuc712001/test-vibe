import { IsString, IsOptional, IsEmail, IsEnum, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'male' })
  @IsString()
  @IsOptional()
  gender?: string;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'HOME' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+84912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Ho Chi Minh' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: '700000' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'HOME' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '+84912345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Vietnam' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '700000' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
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