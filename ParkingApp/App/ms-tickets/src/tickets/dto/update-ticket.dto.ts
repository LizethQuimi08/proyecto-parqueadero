import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
    @ApiPropertyOptional({ description: 'Estado activo del ticket (false = cerrado)', example: false })
    @IsOptional()
    activo?: boolean;

    @ApiPropertyOptional({ description: 'Valor recaudado al cerrar el ticket (en USD)', example: 2.50 })
    @IsNumber()
    @IsOptional()
    valorRecaudado?: number;
}
