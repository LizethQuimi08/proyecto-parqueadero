import { IsNotEmpty, IsString, Matches, MinLength, MaxLength, IsOptional, IsObject, IsIP, IsMACAddress  } from 'class-validator';

export class CreateAuditDto {
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
    
    servicio!: string; //ms-users , ms-auth, ms-products, etc.

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(10)
    @Matches(/^(CREATE|UPDATE|DELETE|LOGIN|LOGOUT)$/,
         { message: 'La acción debe ser CREATE, UPDATE, DELETE, LOGIN o LOGOUT' })
    accion!: string; //CREATE - UPDATE - DELETE - LOGIN - LOGOUT

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
    @IsOptional() //ejemplo: "john.doe", "admin", etc.
    @MinLength(5)
    @MaxLength(25)
    @Matches(/^[a-zA-Z0-9._-]+$/,
        { message: 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos' })
    usuario?: string;

    @IsIP('4', { message: 'La dirección IP debe ser una dirección IPv4 válida' })
    ip!: string;

    @IsMACAddress({ message: 'La dirección MAC debe ser una dirección MAC válida' })
    @IsNotEmpty()
    mac!: string;

}
