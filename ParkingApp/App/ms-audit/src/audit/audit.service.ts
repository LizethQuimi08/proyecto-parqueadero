import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(EventoAuditoria)
    private readonly auditRepo: Repository<EventoAuditoria>,
  ) {}

  async create(dto: CreateAuditDto, context?: any) {
    const newEvent = this.auditRepo.create({
      ...dto,
      tenantId: this.resolveTenantId(context, dto.tenantId),
      datos: dto.datos ?? {},
      timestamp: new Date(),
    });

    return this.auditRepo.save(newEvent);
  }

  async findAll(context?: any) {
    if (this.isSuperAdmin(context)) {
      return this.auditRepo.find({
        order: { timestamp: 'DESC' },
      });
    }

    return this.auditRepo.find({
      where: { tenantId: this.resolveTenantId(context) },
      order: { timestamp: 'DESC' },
    });
  }

  async findOne(id: string, context?: any) {
    if (this.isSuperAdmin(context)) {
      return this.auditRepo.findOne({ where: { id } });
    }
    return this.auditRepo.findOne({ where: { id, tenantId: this.resolveTenantId(context) } });
  }

  async update(id: string, updateAuditDto: UpdateAuditDto, context?: any) {
    const event = await this.findOne(id, context);
    if (!event) {
      throw new NotFoundException(`Evento de auditoria ${id} no encontrado`);
    }

    Object.assign(event, {
      ...updateAuditDto,
      tenantId: this.resolveTenantId(context, updateAuditDto.tenantId ?? event.tenantId),
      datos: updateAuditDto.datos ?? event.datos,
    });

    return this.auditRepo.save(event);
  }

  async remove(id: string, context?: any) {
    const event = await this.findOne(id, context);
    if (!event) {
      throw new NotFoundException(`Evento de auditoria ${id} no encontrado`);
    }
    await this.auditRepo.remove(event);
  }

  private resolveTenantId(context?: any, fallback?: string): string {
    if (this.isSuperAdmin(context)) {
      return context?.headers?.['x-tenant-id'] || context?.tenantId || fallback || context?.user?.tenantId || 'global';
    }
    return context?.user?.tenantId || fallback || 'default';
  }

  private isSuperAdmin(context?: any): boolean {
    return Array.isArray(context?.user?.roles) && context.user.roles.includes('ROLE_SUPER_ADMIN');
  }
}
