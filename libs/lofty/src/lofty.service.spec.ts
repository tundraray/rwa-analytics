import { Test, TestingModule } from '@nestjs/testing';
import { LoftyService } from './lofty.service';

describe('LoftyService', () => {
  let service: LoftyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoftyService],
    }).compile();

    service = module.get<LoftyService>(LoftyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
