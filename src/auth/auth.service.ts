import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { UsersService, SafeUser } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  async me(userId: string) {
    return this.usersService.findById(userId);
  }

  private async buildAuthResponse(user: SafeUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
