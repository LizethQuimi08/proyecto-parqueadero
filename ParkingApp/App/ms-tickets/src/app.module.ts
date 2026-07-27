import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: Number(configService.get<string>('DB_PORT') || 5432),
        username: configService.get<string>('DB_USUARIO') || 'postgres',
        password: configService.get<string>('DB_CONTRASENA') || '',
        database: configService.get<string>('DB_NOMBRE') || 'tickets_db',
        entities: [Ticket],
        synchronize: true,
        logging: true,
      }),
    }),

    AuthModule,
    TicketsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}