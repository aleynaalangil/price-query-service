import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoProvider } from '../providers/coingecko.provider';
import { ConfigService } from '@nestjs/config';

describe('CoinGeckoProvider', () => {
  let provider: CoinGeckoProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinGeckoProvider,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('dummy_key') },
        },
      ],
    }).compile();

    provider = module.get<CoinGeckoProvider>(CoinGeckoProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
