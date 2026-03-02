import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let controller: AppController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleFixture.get<AppController>(AppController);
  });

  it('returns the local welcome page', () => {
    const response = controller.getHello();

    expect(response).toContain('Welcome to the Price Query Service');
    expect(response).toContain('/v1/price/:coinId');
    expect(response).toContain('/v1/price/:coinId/history');
  });
});
