import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(this.configService.get('REDIS_URL'));
  }

  async sendOtp(phone: string, type: string = 'verification'): Promise<void> {
    const otp = randomInt(100000, 999999).toString();
    const key = `otp:${type}:${phone}`;
    
    // Store OTP in Redis with 5 minutes expiration
    await this.redis.setex(key, 300, otp);
    
    // In a real implementation, you would send the OTP via SMS service
    // For now, we'll just log it
    console.log(`OTP for ${phone}: ${otp}`);
    
    // Example with SMS service (uncomment and implement)
    // await this.smsService.sendSms(phone, `Your verification code is: ${otp}`);
  }

  async verifyOtp(phone: string, otp: string, type: string = 'verification'): Promise<boolean> {
    const key = `otp:${type}:${phone}`;
    const storedOtp = await this.redis.get(key);
    
    if (!storedOtp || storedOtp !== otp) {
      return false;
    }
    
    // Delete OTP after successful verification
    await this.redis.del(key);
    
    return true;
  }

  async generateOtp(): Promise<string> {
    return randomInt(100000, 999999).toString();
  }
}