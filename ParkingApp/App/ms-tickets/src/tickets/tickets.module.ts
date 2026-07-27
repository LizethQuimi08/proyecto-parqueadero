import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { HttpClientService } from './common/http-client.service';
import { Ticket } from './entities/ticket.entity';
import { RolesGuard } from '../auth/roles.guard';
import { EventPublisherService } from '../common/event-publisher.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [TicketsController],
  providers: [TicketsService, HttpClientService, RolesGuard, EventPublisherService],
})
export class TicketsModule {}
