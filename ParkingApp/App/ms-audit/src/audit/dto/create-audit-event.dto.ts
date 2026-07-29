import { IsNotEmpty, IsString, Matches, MinLength, MaxLength, IsOptional, IsObject, IsIP, IsMACAddress } from 'class-validator';

export class CreateAuditEventDto {
    @IsString()
    @IsOptional()
    @MaxLength(50)
    @Matches(/^[a-zA-Z0-9._-]+$/, 
        { message: 'El tenantId solo puede contener letras, numeros, puntos, guiones y guiones bajos' })
    tenantId?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(7)
    @MaxLength(50)
    @Matches(/^[a-zA-Z0-9_-]+$/, 
        { message: 'El servicio solo puede contener letras, números, guiones y guiones bajos' })
    servicio!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(10)
    @Matches(/^(CREATE|UPDATE|DELETE|LOGIN|LOGOUT)$/,
         { message: 'La acción debe ser CREATE, UPDATE, DELETE, LOGIN o LOGOUT' })
    accion!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(15)
    @Matches(/^[A-Z-]+$/, 
        { message: 'La entidad solo puede contener letras, números, guiones y guiones bajos' })
    entidad!: string;

    @IsObject()
    @IsOptional()
    datos?: Record<string, any>;

    @IsString()
    @IsOptional()
    usuario?: string;

    @IsString()
    @IsNotEmpty()
    @IsIP()
    ip!: string;

    @IsString()
    @IsNotEmpty()
    @IsMACAddress()
    mac!: string;
}
