import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string = 'development';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsOptional()
  @IsString()
  APP_HOST: string = '0.0.0.0';

  @IsOptional()
  @IsString()
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  UPLOAD_DIR: string = 'uploads';

  @IsOptional()
  @IsString()
  UPLOAD_URL_PREFIX: string = '/uploads';

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string = '7d';

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '30d';

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  R2_BUCKET_NAME?: string;

  @IsOptional()
  @IsString()
  R2_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  R2_ENDPOINT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  const messages = errors.flatMap((error) =>
    Object.values(error.constraints ?? {}).map(
      (message) => `${error.property}: ${message}`,
    ),
  );

  if (validatedConfig.NODE_ENV === 'test') {
    validatedConfig.JWT_SECRET ??= 'test-secret';
    validatedConfig.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
  }

  if (validatedConfig.NODE_ENV !== 'test' && !validatedConfig.JWT_SECRET) {
    messages.push('JWT_SECRET: JWT_SECRET is required outside tests');
  }

  if (
    validatedConfig.NODE_ENV !== 'test' &&
    !validatedConfig.JWT_REFRESH_SECRET
  ) {
    messages.push(
      'JWT_REFRESH_SECRET: JWT_REFRESH_SECRET is required outside tests',
    );
  }

  if (validatedConfig.NODE_ENV !== 'test' && !validatedConfig.DATABASE_URL) {
    messages.push('DATABASE_URL: DATABASE_URL is required outside tests');
  }

  const r2Entries = [
    ['R2_ACCOUNT_ID', validatedConfig.R2_ACCOUNT_ID],
    ['R2_ACCESS_KEY_ID', validatedConfig.R2_ACCESS_KEY_ID],
    ['R2_SECRET_ACCESS_KEY', validatedConfig.R2_SECRET_ACCESS_KEY],
    ['R2_BUCKET_NAME', validatedConfig.R2_BUCKET_NAME],
    ['R2_PUBLIC_URL', validatedConfig.R2_PUBLIC_URL],
    ['R2_ENDPOINT', validatedConfig.R2_ENDPOINT],
  ] as const;
  const configuredR2Entries = r2Entries.filter(([, value]) => Boolean(value));

  if (
    configuredR2Entries.length > 0 &&
    configuredR2Entries.length < r2Entries.length
  ) {
    const missingR2Keys = r2Entries
      .filter(([, value]) => !value)
      .map(([key]) => key);

    messages.push(
      `R2 configuration is incomplete. Missing: ${missingR2Keys.join(', ')}`,
    );
  }

  if (messages.length > 0) {
    throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
  }

  return validatedConfig;
}
