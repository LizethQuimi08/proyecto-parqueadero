import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VehiculosModule } from './vehiculo/vehiculo.module';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    VehiculosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}