import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehiculo } from '../entities/vehiculo.entity';
import { Repository } from 'typeorm';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/update-vehiculo.dto';
import { FactoryVehiculos } from '../factory/factory-vehiculos';
import { EventPublisherService } from '../../common/event-publisher.service';

@Injectable()
export class VehiculosService {
  private readonly logger = new Logger(VehiculosService.name);

  constructor(
    @InjectRepository(Vehiculo)
    private repositoryVehiculo: Repository<Vehiculo>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto, context?: any): Promise<Vehiculo> {
    const tenantId = this.resolveTenantId(context);
    const datos = createVehiculoDto.datos as any;
    const existe = await this.repositoryVehiculo.findOne({
      where: { tenantId, placa: datos.placa },
    });

    if (existe) {
      throw new Error(`Ya existe un vehículo con la placa ${createVehiculoDto.datos.placa}`);
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    vehiculo.tenantId = tenantId;
    vehiculo.ownerDni = datos.ownerDni || this.resolveDni(context);
    vehiculo.ownerUsername = datos.ownerUsername || this.resolveUsername(context);
    vehiculo.estadoAutorizacion = datos.estadoAutorizacion || 'ACEPTADO';
    const savedVehiculo = await this.repositoryVehiculo.save(vehiculo);

    try {
      await this.eventPublisher.publish({
        tenantId,
        servicio: 'ms-vehiculos',
        accion: 'CREATE',
        entidad: 'VEHICULO',
        datos: {
          id: savedVehiculo.id,
          placa: savedVehiculo.placa,
          tipo: createVehiculoDto.tipo,
          marca: createVehiculoDto.datos.marca,
          modelo: createVehiculoDto.datos.modelo,
        },
        usuario: this.resolveUser(context),
        ip: this.resolveIp(context),
        mac: this.resolveMac(context),
      });
    } catch (error) {
      this.logger.warn(`No se pudo publicar la auditoría del vehículo: ${error instanceof Error ? error.message : error}`);
    }

    return savedVehiculo;
  }

  async findAll(): Promise<Vehiculo[]> {
    return this.repositoryVehiculo.find();
  }

  async findAllByTenant(context?: any): Promise<Vehiculo[]> {
    if (this.isSuperAdmin(context)) {
      return this.repositoryVehiculo.find();
    }
    if (this.isEndUser(context)) {
      return this.repositoryVehiculo.find({
        where: [
          { tenantId: this.resolveTenantId(context), ownerUsername: this.resolveUsername(context) },
          { tenantId: this.resolveTenantId(context), ownerDni: this.resolveDni(context) },
        ],
      });
    }
    return this.repositoryVehiculo.find({ where: { tenantId: this.resolveTenantId(context) } });
  }

  async findOne(id: string, context?: any): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: this.scopedWhere({ id }, context) as any });
    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con el id ${id}`);
    }
    return vehiculo;
  }

  async findByPlaca(placa: string, context?: any): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: this.scopedWhere({ placa }, context) as any });
    if (!vehiculo) {
      throw new Error(`No se encontró un vehículo con la placa ${placa}`);
    }
    return vehiculo;
  }

  async update(id: string, updateVehiculoDto: UpdateVehiculoDto, context?: any): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id, context);
    const datos = (updateVehiculoDto as any).datos || updateVehiculoDto;
    Object.assign(vehiculo, datos);
    return this.repositoryVehiculo.save(vehiculo);
  }

  async remove(id: string, context?: any): Promise<void> {
    const vehiculo = await this.findOne(id, context);
    await this.repositoryVehiculo.remove(vehiculo);
  }

  private resolveTenantId(context?: any): string {
    if (this.isSuperAdmin(context)) {
      return context?.headers?.['x-tenant-id'] || context?.tenantId || context?.user?.tenantId || 'global';
    }
    return context?.user?.tenantId || 'default';
  }

  private isSuperAdmin(context?: any): boolean {
    return Array.isArray(context?.user?.roles) && context.user.roles.includes('ROLE_SUPER_ADMIN');
  }

  private isEndUser(context?: any): boolean {
    return Array.isArray(context?.user?.roles) && context.user.roles.includes('ROLE_USER');
  }

  private scopedWhere(base: Record<string, string>, context?: any) {
    if (this.isSuperAdmin(context)) {
      return base;
    }
    const tenantScope = { ...base, tenantId: this.resolveTenantId(context) };
    if (!this.isEndUser(context)) {
      return tenantScope;
    }
    return [
      { ...tenantScope, ownerUsername: this.resolveUsername(context) },
      { ...tenantScope, ownerDni: this.resolveDni(context) },
    ];
  }

  private resolveUser(context?: any): string {
    const user = context?.user;
    return user?.username || user?.sub || user?.email || context?.username || context?.usuario || 'anonymous';
  }

  private resolveUsername(context?: any): string {
    return context?.user?.username || context?.user?.sub || context?.username || '';
  }

  private resolveDni(context?: any): string {
    return context?.headers?.['x-user-dni'] || context?.user?.dni || '';
  }

  private resolveIp(context?: any): string {
    const forwarded = context?.headers?.['x-forwarded-for'];
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return context?.ip || context?.request?.ip || '0.0.0.0';
  }

  private resolveMac(context?: any): string {
    const header = context?.headers?.['x-client-mac'] || context?.headers?.['x-mac-address'];
    if (Array.isArray(header)) {
      return header[0];
    }
    if (typeof header === 'string') {
      return header;
    }
    return context?.mac || '00:00:00:00:00:00';
  }
}
