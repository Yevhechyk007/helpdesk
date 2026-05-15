import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionString = [
          'postgresql://',
          config.getOrThrow('POSTGRES_USER'),
          ':',
          config.getOrThrow('POSTGRES_PASSWORD'),
          '@',
          config.getOrThrow('POSTGRES_HOST'),
          ':',
          config.getOrThrow('POSTGRES_PORT'),
          '/',
          config.getOrThrow('POSTGRES_DB'),
        ].join('');

        const client = postgres(connectionString, { max: 10 });
        return drizzle(client, { schema, logger: process.env.NODE_ENV !== 'production' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
