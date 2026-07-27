import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { Request } from 'express';

@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Body() createAuditDto: CreateAuditDto, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.auditService.create(createAuditDto, req);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.auditService.findAll(req);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.auditService.findOne(id, req);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.auditService.update(id, updateAuditDto, req);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    this.rejectSuperAdminMutation(req);
    return this.auditService.remove(id, req);
  }

  private rejectSuperAdminMutation(req: Request) {
    const roles = (req as any)?.user?.roles ?? [];
    if (Array.isArray(roles) && roles.includes('ROLE_SUPER_ADMIN')) {
      throw new ForbiddenException('SUPER_ADMIN solo puede consultar auditoria, no modificarla');
    }
  }
}
