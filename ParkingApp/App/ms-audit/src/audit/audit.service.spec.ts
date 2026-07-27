import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repository: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(EventoAuditoria),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('debe devolver todos los eventos ordenados por fecha descendente', async () => {
    const eventos = [{ id: '1' }];
    repository.find.mockResolvedValue(eventos);

    await expect(service.findAll()).resolves.toEqual(eventos);
    expect(repository.find).toHaveBeenCalledWith({ order: { timestamp: 'DESC' } });
  });
});
