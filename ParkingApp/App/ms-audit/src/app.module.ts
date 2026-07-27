import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { EventoAuditoria } from './audit/entities/evento-auditoria.entity';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST') || 'localhost',
        port: +config.get('DB_PORT') || 5432,
        username: config.get('DB_USER') || 'postgres',
        password: config.get('DB_PASSWORD') || 'postgres',
        database: config.get('DB_NAME') || 'audit_db',
        entities: [EventoAuditoria],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: +config.get('THROTTLE_TTL') || 60000,
            limit: +config.get('THROTTLE_LIMIT') || 10,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    AuditModule,
    AuthModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
