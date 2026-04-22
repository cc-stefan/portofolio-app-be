import { NestFactory } from '@nestjs/core';
import { hash } from 'bcrypt';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

const PASSWORD_SALT_ROUNDS = 10;

interface CliArgs {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (
      !token.startsWith('--') ||
      value === undefined ||
      value.startsWith('--')
    ) {
      continue;
    }

    switch (token) {
      case '--email':
        args.email = value;
        break;
      case '--password':
        args.password = value;
        break;
      case '--first-name':
      case '--firstName':
        args.firstName = value;
        break;
      case '--last-name':
      case '--lastName':
        args.lastName = value;
        break;
      default:
        break;
    }

    index += 1;
  }

  return args;
}

function printUsage(): void {
  console.error(
    'Usage: pnpm admin:create -- --email admin@example.com --password StrongPass123 [--first-name Admin] [--last-name User]',
  );
}

async function bootstrap(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));

  if (!args.email || !args.password) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const usersService = app.get(UsersService);
    const password = await hash(args.password, PASSWORD_SALT_ROUNDS);
    const admin = await usersService.upsertAdmin({
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      password,
    });

    console.log(`Admin user ready: ${admin.email} (${admin.role})`);
  } finally {
    await app.close();
  }
}

void bootstrap();
