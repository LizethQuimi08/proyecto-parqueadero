import { ChildEntity, Column } from "typeorm";
import { Vehiculo } from "./vehiculo.entity";

export enum TipoMotocicleta {
    DEPORTIVA = 'Deportiva',
    CRUCERO = 'Crucero',
    NAKED = 'Naked',
    SCOOTER = 'Scooter',
    ENDURO = 'Enduro',
}

@ChildEntity('Motocicleta')
export class Motocicleta extends Vehiculo {

    @Column()
    tipo!: TipoMotocicleta;

    getTipo(): string {
        return 'Motocicleta';
    }
}