import { Test, TestingModule } from '@nestjs/testing';
import { DomaineController } from './domaine.controller';
import { DomaineService } from './domaine.service';

describe('DomaineController', () => {
  let controller: DomaineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DomaineController],
      providers: [DomaineService],
    }).compile();

    controller = module.get<DomaineController>(DomaineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
