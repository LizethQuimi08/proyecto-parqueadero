import { Controller, Get, Post, Body, Patch, Put, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { Request } from 'express';

/**
 * Tickets requieren ROLE_ADMIN.
 * Solo los administradores pueden crear, ver y cerrar tickets.
 */
@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN', 'ROLE_USER')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear ticket', description: 'Registra la entrada de un vehículo al parqueadero.' })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  create(@Body() createTicketDto: CreateTicketDto, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.ticketsService.create(createTicketDto, req);
}

  @Get()
  @ApiOperation({ summary: 'Listar todos los tickets', description: 'Retorna todos los tickets registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de tickets retornada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  findAll(@Req() req: Request) {
    return this.ticketsService.findAll(req);
  }

  @Get('activos')
  @ApiOperation({ summary: 'Listar tickets activos', description: 'Retorna los tickets de vehículos que aún están en el parqueadero.' })
  @ApiResponse({ status: 200, description: 'Lista de tickets activos retornada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  findActivos(@Req() req: Request) {
    return this.ticketsService.findActivos(req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID', description: 'Retorna el ticket con el UUID indicado.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket encontrado.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.ticketsService.findOne(id, req);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cerrar ticket', description: 'Registra la salida del vehículo y calcula el valor a cobrar.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket a cerrar' })
  @ApiResponse({ status: 200, description: 'Ticket cerrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  cerrarticket(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.ticketsService.cerrarticket(id, updateTicketDto, req);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar ticket', description: 'Actualiza datos generales de un ticket existente.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket a actualizar' })
  @ApiResponse({ status: 200, description: 'Ticket actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.ticketsService.update(id, updateTicketDto, req);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ticket', description: 'Elimina un ticket del sistema.' })
  @ApiParam({ name: 'id', description: 'UUID del ticket a eliminar' })
  @ApiResponse({ status: 200, description: 'Ticket eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Requiere ROLE_ADMIN.' })
  remove(@Param('id') id: string, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.ticketsService.remove(id, req);
  }

  private rejectSuperAdminMutation(req: Request) {
    const roles = (req as any)?.user?.roles ?? [];
    if (Array.isArray(roles) && roles.includes('ROLE_SUPER_ADMIN')) {
      throw new ForbiddenException('SUPER_ADMIN solo puede consultar tickets de empresas, no modificarlos');
    }
  }
}
