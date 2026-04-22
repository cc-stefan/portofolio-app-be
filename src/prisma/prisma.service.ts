import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/portfolio_app_test?schema=public';
    const adapter = new PrismaPg({
      connectionString,
    });

    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
