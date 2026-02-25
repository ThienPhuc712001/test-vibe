import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkService } from './clerk.provider';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly clerkService: ClerkService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.clerkService.verifyToken(token);
      
      // Attach user to request
      request.user = payload;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}