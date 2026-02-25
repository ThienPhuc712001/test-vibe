import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PrismaService } from '../../database/prisma.service';
import { BcryptService } from '../bcrypt.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email },
        ],
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.bcryptService.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}