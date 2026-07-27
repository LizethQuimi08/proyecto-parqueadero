export class TicketResponseDto {
    id!: string;
    placa!: string;
    dni!: string;
    datosPersona!: string;
    idEspacio!: string;
    zona!: string;
    fechaHoraIngreso!: Date;
    fechaHoraSalida!: Date;
    valorRecaudado!: number;
    activo!: boolean;
    tiempoHoras!: number;
}
