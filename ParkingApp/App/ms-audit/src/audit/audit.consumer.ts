import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import * as amqp from 'amqplib';
import { plainToClass } from 'class-transformer';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { validate, ValidationError } from 'class-validator';

export function getRabbitRoutingPattern(routingKey?: string): string {
  if (!routingKey || routingKey.trim() === '') {
    return 'audit.#';
  }

  return routingKey;
}

@Injectable()
export class AuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumer.name);
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    const host = this.configService.get('RABBITMQ_HOST') || 'localhost';
    const port = this.configService.get('RABBITMQ_PORT') || 5672;
    const user = this.configService.get('RABBITMQ_USER') || 'guest';
    const pass = this.configService.get('RABBITMQ_PASSWORD') || 'guest';
    const url = `amqp://${user}:${pass}@${host}:${port}`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.logger.log(`Conectado a RabbitMQ en ${host}:${port}`);
      await this.consume();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`No se pudo conectar a RabbitMQ: ${errorMessage}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async consume() {
    const queue = this.configService.get('RABBITMQ_QUEUE') || 'audit-queue';
    const exchange =
      this.configService.get('RABBITMQ_EXCHANGE') || 'audit-exchange';
    const routingKey = getRabbitRoutingPattern(
      this.configService.get<string>('RABBITMQ_ROUTING_KEY'),
    );

    if (!this.channel) {
      this.logger.warn('No hay canal de RabbitMQ disponible, se reintentará más tarde');
      setTimeout(() => this.connect(), 5000);
      return;
    }

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, routingKey);

      await this.channel.consume(
        queue,
        async (msg) => {
          if (!msg) {
            return;
          }

          const content = msg.content.toString();
          this.logger.log(`Mensaje recibido: ${content}`);

          try {
            const raw = JSON.parse(content);
            const dto = plainToClass(CreateAuditEventDto, raw);
            const errors = await validate(dto);

            if (Array.isArray(errors) && errors.length > 0) {
              const errorMessages = errors.map((e: ValidationError) =>
                Object.values(e.constraints || {}).join(', '),
              );
              this.logger.warn(`DTO inválido: ${errorMessages.join('; ')}`);
              this.channel?.nack(msg, false, false);
              return;
            }

            await this.auditService.create(dto);
            this.logger.log('Evento de auditoría guardado exitosamente');
            this.channel?.ack(msg);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : 'Error desconocido';
            this.logger.error(`Error procesando mensaje: ${errorMessage}`);
            this.channel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consumidor configurado: queue=${queue}, exchange=${exchange}, routingKey=${routingKey}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error configurando consumidor: ${errorMessage}. Se reintentará en 5s`);
      setTimeout(() => this.connect(), 5000);
    }
  }
}
