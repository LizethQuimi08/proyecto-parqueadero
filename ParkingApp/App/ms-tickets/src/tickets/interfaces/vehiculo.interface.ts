export interface Vehiculo {
    id: string;
    tenantId: string;
    placa: string;
    ownerDni?: string;
    ownerUsername?: string;
    estadoAutorizacion?: string;
    marca: string;
    modelo: string;
    color: string;
    anio: number;
    tipo: string; //auto, moto, camion

}
