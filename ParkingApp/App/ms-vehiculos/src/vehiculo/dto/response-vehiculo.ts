import { Clasificacion } from "../entities/vehiculo.entity";
import { TipoMotocicleta } from "../entities/motocicleta.entity";

export class ResponseVehiculoDto {
    id!: number;
    tenantId!: string;
    placa!: string;
    ownerDni?: string;
    ownerUsername?: string;
    estadoAutorizacion?: string;
    marca!: string;
    modelo!: string;
    color!: string;
    anio!: number;
    clasificacion!: Clasificacion;
    tipo!: TipoMotocicleta;
    numeroPuertas?: number;
    capacidadMaletero?: number
    cabina?: string;
    capacidadCarga?: number;
}
