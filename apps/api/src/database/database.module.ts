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
        const connectionString =
          config.get<string>('DATABASE_URL') ??
          [
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

        const isProduction = config.get('NODE_ENV') === 'production';
        const client = postgres(connectionString, {
          max: 10,
          ssl: isProduction ? 'require' : false,
        });
        return drizzle(client, { schema, logger: !isProduction });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
