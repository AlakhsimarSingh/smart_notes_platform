import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // -----------------------------------
  // SIGNUP
  // -----------------------------------

  async signup(email: string, password: string) {
    const existingUser =
      await this.prisma.user.findUnique({
        where: { email },
      });

    if (existingUser) {
      throw new ConflictException(
        'User already exists',
      );
    }

    const hashed = await bcrypt.hash(
      password,
      10,
    );

    const user =
      await this.prisma.user.create({
        data: {
          email,
          password: hashed,
        },
      });

    return this.signToken(
      user.id,
      user.email,
    );
  }

  // -----------------------------------
  // LOGIN
  // -----------------------------------

  async login(email: string, password: string) {
    const user =
      await this.prisma.user.findUnique({
        where: { email },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const valid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    return this.signToken(
      user.id,
      user.email,
    );
  }

  // -----------------------------------
  // JWT TOKEN
  // -----------------------------------

  async signToken(
    userId: string,
    email: string,
  ) {
    const payload = {
      sub: userId,
      email,
    };

    const token =
      await this.jwt.signAsync(payload);

    return {
      access_token: token,

      user: {
        id: userId,
        email,
      },
    };
  }
}