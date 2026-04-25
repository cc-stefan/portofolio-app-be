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

  if (messages.length > 0) {
    throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
  }

  return validatedConfig;
}
