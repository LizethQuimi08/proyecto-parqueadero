import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ default: 'default' })
    tenantId!: string;

    @Column()
    placa!: string;

    @Column()
    dni!: string;

    @Column({ nullable: true })
    vehiculoId!: string;

    @Column({ nullable: true })
    ownerUsername!: string;

    @Column({type: 'uuid'})
    idEspacio!: string;

    @Column()
    nombreZona!: string;

    @Column({ type: 'timestamp' })
    fechaHoraIngreso!: Date;

    @Column({ type: 'timestamp', nullable: true })
    fechaHoraSalida!: Date;

    @Column({default: true})
    activo!: boolean;

    @Column()
    valorRecaudado!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @CreateDateColumn()
    updatedAt!: Date;
}
