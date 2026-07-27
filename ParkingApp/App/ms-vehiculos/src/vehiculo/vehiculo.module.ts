import { Module } from '@nestjs/common';
import { VehiculosService } from './services/vehiculos.service';
import { VehiculoController } from './vehiculo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Auto } from './entities/auto.entity';
import { Motocicleta } from './entities/motocicleta.entity';
import { Camioneta } from './entities/camioneta.entity';
import { RolesGuard } from '../auth/roles.guard';
import { EventPublisherService } from '../common/event-publisher.service';
import { DemoVehiculosSeeder } from './demo-vehiculos.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Auto, Motocicleta, Camioneta])],
  controllers: [VehiculoController],
  providers: [VehiculosService, RolesGuard, EventPublisherService, DemoVehiculosSeeder],
  exports: [VehiculosService],
})
export class VehiculosModule {}
