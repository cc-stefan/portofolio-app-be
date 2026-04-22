import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { UsersService, SafeUser } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const PASSWORD_SALT_ROUNDS = 10;
const REFRESH_TOKEN_SALT_ROUNDS = 10;
type JwtSignOptions = NonNullable<Parameters<JwtService['signAsync']>[1]>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const password = await hash(registerDto.password, PASSWORD_SALT_ROUNDS);
    const user = await this.usersService.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password,
    });

    return this.buildAuthResponse(user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const passwordMatches = await compare(password, user.password);

    if (!passwordMatches) {
      return null;
    }

    return this.usersService.toSafeUser(user);
  }

  async login(user: SafeUser) {
    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findByIdWithSecrets(payload.sub);

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await compare(refreshToken, user.refreshToken);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(this.usersService.toSafeUser(user));
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async me(userId: string) {
    return this.usersService.findById(userId);
  }

  private async buildAuthResponse(user: SafeUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpiresIn,
      }),
    ]);
    const hashedRefreshToken = await hash(
      refreshToken,
      REFRESH_TOKEN_SALT_ROUNDS,
    );

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private get refreshTokenSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'test-refresh-secret'
    );
  }

  private get refreshTokenExpiresIn(): JwtSignOptions['expiresIn'] {
    return (
      this.configService.get<JwtSignOptions['expiresIn']>(
        'JWT_REFRESH_EXPIRES_IN',
      ) ?? '30d'
    );
  }
}
