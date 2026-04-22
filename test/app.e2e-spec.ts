import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppController } from '../src/app.controller';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/setup-app';
import { UsersService } from '../src/users/users.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('bootstraps the application modules', () => {
    expect(app.get(AuthService)).toBeInstanceOf(AuthService);
    expect(app.get(UsersService)).toBeInstanceOf(UsersService);
    expect(app.get(AppController).getHealth()).toEqual({
      service: 'portfolio-api',
      status: 'ok',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
