import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { Repository } from 'typeorm';                              
import { HttpClientService } from './common/http-client.service';
import { ConfigService } from '@nestjs/config';
import { Vehiculo } from './interfaces/vehiculo.interface';
import { Persona } from './interfaces/persona.interface';         
import { Espacio } from './interfaces/espacio.interface';          
import { EventPublisherService } from '../common/event-publisher.service';

@Injectable()
export class TicketsService {

  private readonly logger = new Logger(TicketsService.name);
  private readonly personaUrl: string;
  private readonly vehiculoUrl: string;                           
  private readonly espacioUrl: string;
  private readonly tarifaPorHora: number;
  

  
  constructor(
  @InjectRepository(Ticket)
  private ticketRepository: Repository<Ticket>,
  private httpClient: HttpClientService,                       
  private configService: ConfigService,
  private readonly eventPublisher: EventPublisherService,
  ) {
  this.personaUrl = this.configService.get('MS_PERSONAS') || 'http://localhost:8082/api/users';
  this.vehiculoUrl = this.configService.get('MS_VEHICULOS') || 'http://localhost:3000/vehiculo';   
  this.espacioUrl = this.configService.get('MS_ZONAS') || 'http://localhost:8081/api/espacios';
  this.tarifaPorHora = this.configService.get('TARIFA_HORA', 1.0);
  }

  async create(createTicketDto: CreateTicketDto, context?: any): Promise<Ticket> {
    const { usuario, ip, mac } = this.extractUserInfo(context);
    const tenantId = this.extractTenantId(context);
    const token = this.extractToken(context);

    //1.- Validar que la persona exista
    const persona = await this.validarPersona(createTicketDto.dni, token);
    if (!persona) {
      throw new BadRequestException(`Persona con DNI: ${createTicketDto.dni} no encontrada`); 
    }

    //2.- Validar que el vehículo exista
    const vehiculo = await this.validarPlaca(createTicketDto.placa, token);
    if (!vehiculo) {
      throw new BadRequestException(`Vehículo con placa: ${createTicketDto.placa} no encontrado`);
    }
    this.validarVehiculoAutorizado(vehiculo, createTicketDto.dni, context);

    //3.- Validar el espacio disponible
    const espacio = await this.validarEspacioDisponible(createTicketDto.idEspacio, createTicketDto.nombreZona, token); 
    if (!espacio) {
      throw new BadRequestException(`Espacio con ID: ${createTicketDto.idEspacio} no disponible`);
    }

    //4.- Validar tickets no activos
    await this.validarTicketActivo(createTicketDto.placa, tenantId);        

    //5.- Crear el ticket
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      tenantId,
      vehiculoId: vehiculo.id,
      ownerUsername: vehiculo.ownerUsername || this.extractUsername(context),
      fechaHoraIngreso: new Date(),
      activo: true,
      valorRecaudado: 0,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);

    await this.eventPublisher.publish({
      tenantId,
      servicio: 'ms-tickets',
      accion: 'CREATE',
      entidad: 'TICKET',
      datos: {
        id: ticketGuardado.id,
        placa: ticketGuardado.placa,
        dni: ticketGuardado.dni,
        vehiculoId: ticketGuardado.vehiculoId,
        ownerUsername: ticketGuardado.ownerUsername,
        idEspacio: ticketGuardado.idEspacio,
        nombreZona: ticketGuardado.nombreZona,
        activo: ticketGuardado.activo,
        fechaHoraIngreso: ticketGuardado.fechaHoraIngreso,
      },
      usuario,
      ip,
      mac,
    });

    
    // Actualizar estado del espacio a OCUPADO
    await this.actualizarEstadoEspacio(createTicketDto.idEspacio, 'OCUPADO', token);
    
    this.logger.log(`Ticket creado con ID: ${ticketGuardado.id} para la placa ${createTicketDto.placa}`); 
    return ticketGuardado;                                        
  }

  async findAll(context?: any): Promise<Ticket[]> {
    if (this.isSuperAdmin(context)) {
      return this.ticketRepository.find({
        order: {fechaHoraIngreso: 'DESC'},
      });
    }
    if (this.isEndUser(context)) {
      return this.ticketRepository.find({
        where: [
          { tenantId: this.extractTenantId(context), ownerUsername: this.extractUsername(context) },
          { tenantId: this.extractTenantId(context), dni: this.extractDni(context) },
        ],
        order: {fechaHoraIngreso: 'DESC'},
      });
    }

    return this.ticketRepository.find({
      where: { tenantId: this.extractTenantId(context) },
      order: {fechaHoraIngreso: 'DESC'},
    });
  }

  async findOne(id: string, context?: any): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: this.ticketScope({ id }, context) as any });
    if (!ticket) 
      throw new BadRequestException(`Ticket con ID: ${id} no encontrado`);
    return ticket;
  }

  async findActivos(context?: any): Promise<Ticket[]> {
    if (this.isSuperAdmin(context)) {
      return this.ticketRepository.find({
        where: { activo: true },
        order: {fechaHoraIngreso: 'DESC'},
      });
    }
    if (this.isEndUser(context)) {
      return this.ticketRepository.find({
        where: [
          { activo: true, tenantId: this.extractTenantId(context), ownerUsername: this.extractUsername(context) },
          { activo: true, tenantId: this.extractTenantId(context), dni: this.extractDni(context) },
        ],
        order: {fechaHoraIngreso: 'DESC'},
      });
    }

    return this.ticketRepository.find({
      where: { activo: true, tenantId: this.extractTenantId(context) },
      order: {fechaHoraIngreso: 'DESC'},
    });
  }



  async cerrarticket(id: string, updateTicketDto: UpdateTicketDto, context?: any): Promise<Ticket> {
    const ticket = await this.findOne(id, context);
    if (!ticket) {
      throw new BadRequestException(`Ticket con ID: ${id} no encontrado`);
    }
    
    const fechaHoraSalida = new Date();

    const horas = this.calcularHoras(ticket.fechaHoraIngreso, fechaHoraSalida);
    const costo = horas * this.tarifaPorHora;

    ticket.activo = false;
    ticket.fechaHoraSalida = fechaHoraSalida;
    ticket.valorRecaudado = updateTicketDto.valorRecaudado || costo;

    const token = this.extractToken(context);

    // Actualizar estado del espacio a DISPONIBLE
    await this.actualizarEstadoEspacio(ticket.idEspacio, 'DISPONIBLE', token);

    const closeTicket = await this.ticketRepository.save(ticket);

    const { usuario, ip, mac } = this.extractUserInfo(context);
    await this.eventPublisher.publish({
      tenantId: this.extractTenantId(context),
      servicio: 'ms-tickets',
      accion: 'UPDATE',
      entidad: 'TICKET',
      datos: {
        id: closeTicket.id,
        placa: closeTicket.placa,
        dni: closeTicket.dni,
        idEspacio: closeTicket.idEspacio,
        nombreZona: closeTicket.nombreZona,
        activo: closeTicket.activo,
        fechaHoraIngreso: closeTicket.fechaHoraIngreso,
        fechaHoraSalida: closeTicket.fechaHoraSalida,
        valorRecaudado: closeTicket.valorRecaudado,
        horasCobradas: horas,
      },
      usuario,
      ip,
      mac,
    }, 'audit.ticket.update');

    this.logger.log(`Ticket con ID: ${id} cerrado.`);
    return closeTicket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, context?: any): Promise<Ticket> {
    const ticket = await this.findOne(id, context);
    const tenantId = ticket.tenantId;
    const previo = { ...ticket };

    Object.assign(ticket, {
      placa: updateTicketDto.placa ?? ticket.placa,
      dni: updateTicketDto.dni ?? ticket.dni,
      idEspacio: updateTicketDto.idEspacio ?? ticket.idEspacio,
      nombreZona: updateTicketDto.nombreZona ?? ticket.nombreZona,
      activo: updateTicketDto.activo ?? ticket.activo,
      valorRecaudado: updateTicketDto.valorRecaudado ?? ticket.valorRecaudado,
    });

    const updated = await this.ticketRepository.save(ticket);
    const { usuario, ip, mac } = this.extractUserInfo(context);

    await this.eventPublisher.publish({
      tenantId,
      servicio: 'ms-tickets',
      accion: 'UPDATE',
      entidad: 'TICKET',
      datos: { id: updated.id, previo, actualizado: updated },
      usuario,
      ip,
      mac,
    }, 'audit.ticket.update');

    return updated;
  }

  async remove(id: string, context?: any): Promise<void> {
    const ticket = await this.findOne(id, context);
    await this.ticketRepository.remove(ticket);

    const { usuario, ip, mac } = this.extractUserInfo(context);
    await this.eventPublisher.publish({
      tenantId: ticket.tenantId,
      servicio: 'ms-tickets',
      accion: 'DELETE',
      entidad: 'TICKET',
      datos: { id: ticket.id, placa: ticket.placa, dni: ticket.dni },
      usuario,
      ip,
      mac,
    }, 'audit.ticket.delete');
  }

  //Metodos privados para cada una de las validaciones
  private async validarPersona(dni: string, token?: string): Promise<Persona | null> {
    try {
      const url = `${this.personaUrl}/dni/${dni}`;
      const persona = await this.httpClient.get<Persona>(url, token);
      return persona;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }                                                              

  private async validarPlaca(placa: string, token?: string): Promise<Vehiculo | null> {
    try {
      const url = `${this.vehiculoUrl}/placa/${placa}`;
      const vehiculo = await this.httpClient.get<Vehiculo>(url, token);
      return vehiculo;
    } catch (error) {
      this.logger.error(`Error al validar la placa (${placa}): (error)`); 
      return null;
    }
  }

  private validarVehiculoAutorizado(vehiculo: Vehiculo, dni: string, context?: any): void {
    if (vehiculo.estadoAutorizacion && vehiculo.estadoAutorizacion !== 'ACEPTADO') {
      throw new BadRequestException(`Vehiculo ${vehiculo.placa} no esta aceptado para operar`);
    }

    if (vehiculo.ownerDni && vehiculo.ownerDni !== dni) {
      throw new BadRequestException(`La placa ${vehiculo.placa} no pertenece al DNI ${dni}`);
    }

    if (this.isEndUser(context) && vehiculo.ownerUsername && vehiculo.ownerUsername !== this.extractUsername(context)) {
      throw new BadRequestException(`La placa ${vehiculo.placa} no pertenece al usuario autenticado`);
    }
  }

  private async validarEspacioDisponible(idEspacio: string, zona: string, token?: string): Promise<Espacio | null> {
    try {
      const url = `${this.espacioUrl}/disponibles?zona=${encodeURIComponent(zona)}`;
      const espacios = await this.httpClient.get<Espacio[]>(url, token);

      return espacios.find(                                       
        espacio => espacio.id === idEspacio && espacio.estado === 'DISPONIBLE'
      ) ?? null;
    } catch (error) {
      this.logger.error(`Error al validar el espacio (error)`);
      return null;
    }
  }

  private async validarTicketActivo(placa: string, tenantId: string): Promise<void> { 
    try {
      const ticketActivo = await this.ticketRepository.findOne(
        { where: { placa, tenantId, activo: true } });
      if (ticketActivo) {
        throw new BadRequestException(`Ya existe un ticket activo con esta placa`);
      }
    } catch (error) {                                             
      throw error;
    } 
  }

  private calcularHoras(ingreso: Date, salida: Date): number {
    const diffMs = salida.getTime() - ingreso.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    return Math.ceil(diffHoras); 
  }

  private async actualizarEstadoEspacio(idEspacio: string, estado: string, token?: string): Promise<void> {
    try {
      const url = `${this.espacioUrl}/${idEspacio}/estado?estado=${estado}`;
      await this.httpClient.patch(url, {}, token);
      this.logger.log(`Espacio ${idEspacio} actualizado a estado ${estado}`);
    } catch (error) {
      this.logger.error(`Error al actualizar estado del espacio ${idEspacio}: ${error}`);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  private extractUserInfo(req: any): { usuario: string; ip: string; mac: string } {
    const usuario = req?.user?.username || req?.user?.sub || 'anonymous';
    const ip = req?.ip || req?.socket?.remoteAddress || '0.0.0.0';
    const mac = '00:00:00:00:00:00';
    return { usuario, ip, mac };
  }

  private extractTenantId(req: any): string {
    if (this.isSuperAdmin(req)) {
      return req?.headers?.['x-tenant-id'] || req?.tenantId || req?.user?.tenantId || 'global';
    }
    return req?.user?.tenantId || 'default';
  }

  private isSuperAdmin(req: any): boolean {
    return Array.isArray(req?.user?.roles) && req.user.roles.includes('ROLE_SUPER_ADMIN');
  }

  private isEndUser(req: any): boolean {
    return Array.isArray(req?.user?.roles) && req.user.roles.includes('ROLE_USER');
  }

  private ticketScope(base: Record<string, string>, req?: any) {
    if (this.isSuperAdmin(req)) {
      return base;
    }
    const tenantScope = { ...base, tenantId: this.extractTenantId(req) };
    if (!this.isEndUser(req)) {
      return tenantScope;
    }
    return [
      { ...tenantScope, ownerUsername: this.extractUsername(req) },
      { ...tenantScope, dni: this.extractDni(req) },
    ];
  }

  private extractUsername(req: any): string {
    return req?.user?.username || req?.user?.sub || '';
  }

  private extractDni(req: any): string {
    return req?.headers?.['x-user-dni'] || req?.user?.dni || '';
  }

  private extractToken(req: any): string | undefined {
    const auth = req?.headers?.authorization || req?.headers?.Authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return auth.substring(7);
    }
    return undefined;
  }
}

// LEVANTAR TODOS LOS MICROSERVICIOS PARA PROBAR EL SERVICIO DE TICKETS, 
// SI NO SE CUENTA CON LOS OTROS MICROSERVICIOS SE PUEDEN SIMULAR LAS RESPUESTAS CON MOCKS O STUBS.
