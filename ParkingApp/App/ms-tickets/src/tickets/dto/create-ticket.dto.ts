import { IsNotEmpty, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
    @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-1234' })
    @IsString()
    @IsNotEmpty()
    placa!: string;

    @ApiProperty({ description: 'DNI/cédula del conductor', example: '1234567890' })
    @IsString()
    @IsNotEmpty()
    dni!: string;

    @ApiProperty({ description: 'UUID del espacio de parqueadero asignado', example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsUUID()
    @IsNotEmpty()
    idEspacio!: string;

    @ApiProperty({ description: 'Nombre de la zona del parqueadero', example: 'Zona A' })
    @IsString()
    @IsNotEmpty()
    nombreZona!: string;
}
