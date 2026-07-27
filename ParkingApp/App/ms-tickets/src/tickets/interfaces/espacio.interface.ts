export interface Espacio {
    id: string;
    codigo: string; //verificar nombre
    zona: string;
    tipo?: string; //auto, moto, camion
    estado: string; //DISPONIBLE, OCUPADO, RESERVADO
}