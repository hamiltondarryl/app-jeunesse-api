import { Test, TestingModule } from '@nestjs/testing';
import { DepartementService } from './departement.service';

describe('DepartementService', () => {
  let service: DepartementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartementService],
    }).useMocker(() => ({})).compile();

    service = module.get<DepartementService>(DepartementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
