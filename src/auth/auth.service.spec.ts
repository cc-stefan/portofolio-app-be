import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, type User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';

type UsersServiceMethods = Pick<
  UsersService,
  | 'create'
  | 'findByEmail'
  | 'findById'
  | 'findByIdWithSecrets'
  | 'toSafeUser'
  | 'updateRefreshToken'
>;

type UsersServiceMock = {
  [Key in keyof UsersServiceMethods]: jest.MockedFunction<
    UsersServiceMethods[Key]
  >;
};

describe('AuthService', () => {
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
  const usersService: UsersServiceMock = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIdWithSecrets: jest.fn(),
    toSafeUser: jest.fn(),
    updateRefreshToken: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'access-secret',
        JWT_EXPIRES_IN: '7d',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '30d',
      };

      return config[key];
    }),
  } as unknown as ConfigService;

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      usersService as never,
      jwtService,
      configService,
    );
  });

  it('returns rotated access and refresh tokens for a valid refresh token', async () => {
    const refreshToken = 'existing-refresh-token';
    const hashedRefreshToken = await hash(refreshToken, 10);
    let persistedRefreshToken: string | null | undefined;
    const user = {
      id: '4d203943-cf4f-4cea-90b8-4f6dbf2f4eb2',
      email: 'admin@example.com',
      password: 'hashed-password',
      refreshToken: hashedRefreshToken,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies User;
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    jwtService.signAsync = jest
      .fn()
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');
    usersService.findByIdWithSecrets.mockResolvedValue(user);
    usersService.toSafeUser.mockReturnValue(safeUser);
    usersService.updateRefreshToken.mockImplementation(
      (_userId: string, refreshToken: string | null) => {
        persistedRefreshToken = refreshToken;
        return Promise.resolve();
      },
    );

    const result = await authService.refresh(refreshToken);

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: safeUser,
    });
    expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
    );
    if (typeof persistedRefreshToken !== 'string') {
      throw new Error('Expected refresh token hash to be stored');
    }

    await expect(
      compare('new-refresh-token', persistedRefreshToken),
    ).resolves.toBe(true);
  });

  it('rejects refresh when the stored hash is missing', async () => {
    const userWithoutRefreshToken = {
      id: '4d203943-cf4f-4cea-90b8-4f6dbf2f4eb2',
      email: 'user@example.com',
      password: 'hashed-password',
      refreshToken: null,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies User;

    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      sub: userWithoutRefreshToken.id,
      email: userWithoutRefreshToken.email,
      role: UserRole.USER,
    });
    usersService.findByIdWithSecrets.mockResolvedValue(userWithoutRefreshToken);

    await expect(authService.refresh('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('clears the refresh token hash on logout', async () => {
    usersService.updateRefreshToken.mockResolvedValue(undefined);

    await authService.logout('user-id');

    expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
      'user-id',
      null,
    );
  });
});
