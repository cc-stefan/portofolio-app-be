import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role?: UserRole;
}

export type SafeUser = Omit<User, 'password' | 'refreshToken'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<SafeUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          firstName: input.firstName,
          lastName: input.lastName,
          password: input.password,
          role: input.role ?? UserRole.USER,
        },
      });

      return this.toSafeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async findByIdWithSecrets(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.findByIdWithSecrets(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSafeUser(user);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken,
      },
    });
  }

  async upsertAdmin(input: CreateUserInput): Promise<SafeUser> {
    const user = await this.prisma.user.upsert({
      where: {
        email: input.email.toLowerCase(),
      },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password,
        role: UserRole.ADMIN,
      },
      create: {
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        password: input.password,
        role: UserRole.ADMIN,
      },
    });

    return this.toSafeUser(user);
  }

  toSafeUser(user: User): SafeUser {
    const { password, refreshToken, ...safeUser } = user;
    void password;
    void refreshToken;

    return safeUser;
  }
}
