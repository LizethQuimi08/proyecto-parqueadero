import { Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// Metodo para calcular el año actual y establecerlo como límite máximo para el año del vehículo
const currentYear = new Date().getFullYear();

class BaseVehiculoDto {

    @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-1234' })
    @IsString()
    @Matches(/^[A-Z]{3}-\d{4}$/, 
        { message: 'La placa debe tener el formato ABC-1234' }
    )
    placa!: string;

    @ApiProperty({ description: 'DNI/cedula del propietario', example: '2234567891', required: false })
    @IsString()
    @IsOptional()
    @Matches(/^[0-9]{1,10}$/, { message: 'El DNI del propietario debe contener solo digitos' })
    ownerDni?: string;

    @ApiProperty({ description: 'Username del propietario', example: 'user_empresa1', required: false })
    @IsString()
    @IsOptional()
    ownerUsername?: string;

    @ApiProperty({ description: 'Estado de autorizacion del vehiculo', example: 'ACEPTADO', enum: ['PENDIENTE', 'ACEPTADO', 'RECHAZADO'], required: false })
    @IsString()
    @IsOptional()
    @IsIn(['PENDIENTE', 'ACEPTADO', 'RECHAZADO'])
    estadoAutorizacion?: string;

    @ApiProperty({ description: 'Marca del vehículo', example: 'Toyota' })
    @IsString()
    @IsNotEmpty({ message: 'La marca no puede estar vacía' })
    @MinLength(3, { message: 'La marca debe tener al menos 3 caracteres' })
    @MaxLength(50, { message: 'La marca no puede tener más de 50 caracteres' })
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, { message: 'La marca solo puede contener letras y espacios' })
    marca!: string;

    @ApiProperty({ description: 'Modelo del vehículo', example: 'Corolla' })
    @IsString()
    @IsNotEmpty({ message: 'El modelo no puede estar vacío' })
    @MinLength(1, { message: 'El modelo debe tener al menos 1 carácter' })
    @MaxLength(20, { message: 'El modelo no puede tener más de 20 caracteres' })
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, { message: 'El modelo solo puede contener letras y espacios' })
    modelo!: string;

    @ApiProperty({ description: 'Color del vehículo', example: 'Blanco' })
    @IsString()
    @IsNotEmpty({ message: 'El color no puede estar vacío' })
    @MinLength(4, { message: 'El color debe tener al menos 4 caracteres' })
    @MaxLength(20, { message: 'El color no puede tener más de 20 caracteres' })
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, { message: 'El color solo puede contener letras y espacios' })
    color!: string;

    @ApiProperty({ description: 'Año del vehículo', example: 2022, minimum: 1900, maximum: currentYear })
    @IsNumber()
    @Min(1900, { message: 'El año debe ser mayor o igual a 1900' })
    @Max(currentYear, { message: 'El año no puede ser mayor al año actual' })
    anio!: number;

    @ApiProperty({ description: 'Clasificación del vehículo', example: 'Sedán' })
    @IsString()
    clasificacion!: string;
}

class AutoDto extends BaseVehiculoDto {
    @ApiProperty({ description: 'Número de puertas del auto', example: 4, minimum: 2, maximum: 5 })
    @IsNumber()
    @IsPositive({ message: 'El número de puertas debe ser un número positivo' })
    @Min(2, { message: 'El número de puertas debe ser al menos 2' })
    @Max(5, { message: 'El número de puertas no puede ser mayor a 5' })
    numeroPuertas!: number;

    @ApiProperty({ description: 'Capacidad del maletero en litros', example: 400, minimum: 0, maximum: 1000 })
    @IsNumber()
    @IsPositive({ message: 'La capacidad del maletero debe ser un número positivo' })
    @Min(0, { message: 'La capacidad del maletero debe ser un número no negativo' })
    @Max(1000, { message: 'La capacidad del maletero no puede ser mayor a 1000 litros' })
    capacidadMaletero!: number;
}

class MotoDto extends BaseVehiculoDto {
    @ApiProperty({ description: 'Tipo de motocicleta', example: 'Deportiva', enum: ['Deportiva', 'Crucero', 'Naked', 'Scooter', 'Enduro'] })
    @IsString()
    @IsNotEmpty({ message: 'El tipo de motocicleta no puede estar vacío' })
    @Matches(/^(Deportiva|Crucero|Naked|Scooter|Enduro)$/, 
        { message: 'El tipo de motocicleta debe ser uno de los siguientes: Deportiva, Crucero, Naked, Scooter, Enduro' }
    )
    tipo!: string;
}

class CamionetaDto extends BaseVehiculoDto {
    @ApiProperty({ description: 'Tipo de cabina', example: 'Doble', enum: ['Simple', 'Doble'] })
    @IsString()
    @IsNotEmpty({ message: 'La cabina no puede estar vacía' })
    @Matches(/^(Simple|Doble)$/, 
        { message: 'La cabina debe ser Simple o Doble' }
    )
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s][a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/, 
        { message: 'La cabina debe comenzar con mayúscula y solo contener letras' }
    )
    cabina!: string;

    @ApiProperty({ description: 'Capacidad de carga en kg', example: 1000, minimum: 0, maximum: 10000 })
    @IsNumber()
    @IsPositive({ message: 'La capacidad de carga debe ser un número positivo' })
    @Min(0, { message: 'La capacidad de carga debe ser un número no negativo' })
    @Max(10000, { message: 'La capacidad de carga no puede ser mayor a 10000 kg' })
    capacidadCarga!: number;
}

export class CreateVehiculoDto {
  @ApiProperty({ description: 'Tipo de vehículo', example: 'Auto', enum: ['Auto', 'Moto', 'Camioneta'] })
  @IsIn(['Auto', 'Moto', 'Camioneta'])
  tipo!: string;

  @ApiProperty({ description: 'Datos específicos del vehículo según su tipo' })
  @ValidateNested()
  @Type((opts) => {
    const object = opts?.object as CreateVehiculoDto;
    if (!object) return BaseVehiculoDto;

    switch (object.tipo) {
      case 'Auto':
        return AutoDto;
      case 'Moto':
        return MotoDto;
      case 'Camioneta':
        return CamionetaDto;
      default:
        return BaseVehiculoDto;
    }
  })
  datos!: AutoDto | MotoDto | CamionetaDto;
}
