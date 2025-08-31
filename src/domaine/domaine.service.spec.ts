import { Test, TestingModule } from '@nestjs/testing';
import { DomaineService } from './domaine.service';

describe('DomaineService', () => {
  let service: DomaineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DomaineService],
    }).compile();

    service = module.get<DomaineService>(DomaineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
