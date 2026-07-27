import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

type AmqpConnection = amqp.Connection & {
  createChannel(): Promise<amqp.Channel>;
  close(): Promise<void>;
};

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
  private connection: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchangeName: string;
  private readonly routingKey: string;

  constructor(private readonly configService: ConfigService) {
    this.exchangeName = this.configService.get<string>('RABBITMQ_EXCHANGE') || 'audit-exchange';
    this.routingKey = this.configService.get<string>('RABBITMQ_ROUTING_KEY') || 'audit.vehiculo.create';
  }

  private async connect(): Promise<void> {
    if (this.channel) {
      return;
    }

    const host = this.configService.get<string>('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get<number>('RABBITMQ_PORT') || 5672;
    const user = this.configService.get<string>('RABBITMQ_USER') || 'guest';
    const pass = this.configService.get<string>('RABBITMQ_PASSWORD') || 'guest';
    const url = `amqp://${user}:${pass}@${host}:${port}`;

    const connection = await amqp.connect(url);
    this.connection = connection as unknown as AmqpConnection;
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
  }

  async publish(event: AuditEvent): Promise<void> {
    try {
      await this.connect();
      if (!this.channel) {
        throw new Error('No se pudo inicializar el canal de RabbitMQ');
      }

      this.channel.publish(this.exchangeName, this.routingKey, Buffer.from(JSON.stringify(event)), { persistent: true });
      this.logger.log(`Evento de auditoría publicado: ${event.accion} ${event.entidad}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`No se pudo publicar el evento de auditoría: ${message}`);
      throw error;
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
