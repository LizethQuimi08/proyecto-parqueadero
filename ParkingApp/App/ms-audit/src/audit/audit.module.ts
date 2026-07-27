import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditConsumer } from './audit.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventoAuditoria])],
  controllers: [AuditController],
  providers: [AuditService, AuditConsumer],
})
export class AuditModule {}
