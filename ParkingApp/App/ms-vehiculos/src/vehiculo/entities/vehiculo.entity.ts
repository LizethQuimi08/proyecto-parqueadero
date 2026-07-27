import { Column, Entity, Index, PrimaryGeneratedColumn, TableInheritance } from 'typeorm';

export enum Clasificacion {
  ELECTRICO = 'Eléctrico',
  HIBRIDO = 'Híbrido',
  GASOLINA = 'Gasolina',
  DIESEL = 'Diésel',
}

@Entity()
@Index(['tenantId', 'placa'], { unique: true })
@Index(['tenantId', 'ownerDni'])
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export abstract class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: 'default' })
  tenantId!: string;
    
  @Column()
  placa!: string;

    @Column({ nullable: true })
    ownerDni!: string;

    @Column({ nullable: true })
    ownerUsername!: string;

    @Column({ default: 'ACEPTADO' })
    estadoAutorizacion!: string;

    @Column()
    marca!: string;

    @Column()
    modelo!: string;

    @Column()
    color!: string;

    @Column()
    anio!: number;

    @Column()
    clasificacion!: Clasificacion;

    abstract getTipo(): string;
}
