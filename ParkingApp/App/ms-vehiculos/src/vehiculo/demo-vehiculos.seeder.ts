import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auto } from './entities/auto.entity';
import { Motocicleta, TipoMotocicleta } from './entities/motocicleta.entity';
import { Camioneta } from './entities/camioneta.entity';
import { Clasificacion } from './entities/vehiculo.entity';

@Injectable()
export class DemoVehiculosSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Auto)
    private readonly autoRepository: Repository<Auto>,
    @InjectRepository(Motocicleta)
    private readonly motoRepository: Repository<Motocicleta>,
    @InjectRepository(Camioneta)
    private readonly camionetaRepository: Repository<Camioneta>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedEmpresa1();
    await this.seedEmpresa2();
  }

  private async seedEmpresa1() {
    await this.seedAuto({
      tenantId: 'empresa1',
      placa: 'EAA-1001',
      ownerDni: '2234567891',
      ownerUsername: 'user_empresa1',
      estadoAutorizacion: 'ACEPTADO',
      marca: 'Toyota',
      modelo: 'Corolla',
      color: 'Blanco',
      anio: 2022,
      clasificacion: Clasificacion.GASOLINA,
      numeroPuertas: 4,
      capacidadMaletero: 420,
    });

    await this.seedMoto({
      tenantId: 'empresa1',
      placa: 'EAM-1002',
      ownerDni: '2234567891',
      ownerUsername: 'user_empresa1',
      estadoAutorizacion: 'ACEPTADO',
      marca: 'Yamaha',
      modelo: 'Fazer',
      color: 'Azul',
      anio: 2021,
      clasificacion: Clasificacion.GASOLINA,
      tipo: TipoMotocicleta.NAKED,
    });
  }

  private async seedEmpresa2() {
    await this.seedAuto({
      tenantId: 'empresa2',
      placa: 'EBB-2001',
      ownerDni: '2234567892',
      ownerUsername: 'user_empresa2',
      estadoAutorizacion: 'ACEPTADO',
      marca: 'Hyundai',
      modelo: 'Accent',
      color: 'Gris',
      anio: 2023,
      clasificacion: Clasificacion.GASOLINA,
      numeroPuertas: 4,
      capacidadMaletero: 390,
    });

    await this.seedCamioneta({
      tenantId: 'empresa2',
      placa: 'EBC-2002',
      ownerDni: '2234567892',
      ownerUsername: 'user_empresa2',
      estadoAutorizacion: 'ACEPTADO',
      marca: 'Chevrolet',
      modelo: 'Dmax',
      color: 'Negro',
      anio: 2020,
      clasificacion: Clasificacion.DIESEL,
      cabina: 'Doble',
      capacidadCarga: 950,
    });
  }

  private async seedAuto(data: Partial<Auto> & Pick<Auto, 'tenantId' | 'placa'>) {
    const existing = await this.autoRepository.findOne({ where: { tenantId: data.tenantId, placa: data.placa } });
    if (existing) {
      await this.autoRepository.save({ ...existing, ...data });
      return;
    }
    await this.autoRepository.save(this.autoRepository.create(data));
  }

  private async seedMoto(data: Partial<Motocicleta> & Pick<Motocicleta, 'tenantId' | 'placa'>) {
    const existing = await this.motoRepository.findOne({ where: { tenantId: data.tenantId, placa: data.placa } });
    if (existing) {
      await this.motoRepository.save({ ...existing, ...data });
      return;
    }
    await this.motoRepository.save(this.motoRepository.create(data));
  }

  private async seedCamioneta(data: Partial<Camioneta> & Pick<Camioneta, 'tenantId' | 'placa'>) {
    const existing = await this.camionetaRepository.findOne({ where: { tenantId: data.tenantId, placa: data.placa } });
    if (existing) {
      await this.camionetaRepository.save({ ...existing, ...data });
      return;
    }
    await this.camionetaRepository.save(this.camionetaRepository.create(data));
  }
}
