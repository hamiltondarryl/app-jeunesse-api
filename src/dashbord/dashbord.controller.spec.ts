import { Test, TestingModule } from '@nestjs/testing';
import { DashbordController } from './dashbord.controller';
import { DashbordService } from './dashbord.service';

describe('DashbordController', () => {
  let controller: DashbordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashbordController],
      providers: [DashbordService],
    }).compile();

    controller = module.get<DashbordController>(DashbordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
