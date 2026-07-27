import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface AuditEvent {
  tenantId?: string;
  servicio: string;
  accion: string;
  entidad: string;
  datos?: Record<string, any>;
  usuario?: string;
  ip?: string;
  mac?: string;
}

@Injectable()
export class EventPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: any = null;
  private channel: any = null;

  private readonly exchangeName: string;
  private readonly routingKey: string;

  constructor(private readonly configService: ConfigService) {
    this.exchangeName =
      this.configService.get<string>('RABBITMQ_EXCHANGE') || 'audit-exchange';

    this.routingKey =
      this.configService.get<string>('RABBITMQ_ROUTING_KEY') || 'audit.ticket.create';
  }

  private async connect(): Promise<void> {
    if (this.channel) {
      return;
    }

    const host = this.configService.get<string>('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get<string>('RABBITMQ_PORT') || '5672';
    const user = this.configService.get<string>('RABBITMQ_USER') || 'guest';
    const pass = this.configService.get<string>('RABBITMQ_PASSWORD') || 'guest';

    const url = `amqp://${user}:${pass}@${host}:${port}`;

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    this.logger.log(`Conectado a RabbitMQ en ${host}:${port}`);
  }

  async publish(event: AuditEvent, routingKey?: string): Promise<void> {
    try {
      await this.connect();

      this.channel.publish(
        this.exchangeName,
        routingKey || this.routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );

      this.logger.log(
        `Evento publicado en RabbitMQ: ${event.servicio} - ${event.accion} - ${event.entidad}`,
      );
    } catch (error) {
      this.logger.error(
        `No se pudo publicar evento de auditoría: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }
  }
}
