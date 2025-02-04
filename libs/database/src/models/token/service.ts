import { Inject, Injectable } from '@nestjs/common';
import { TokenModel, TOKENS_REPOSITORY } from './entity';

@Injectable()
export class TokenService {
  getTokenByTokenId(tokenId: string, network: string) {
    return this.tokenModel.findOne({
      where: { tokenId: tokenId.toString(), network },
    });
  }
  constructor(
    @Inject(TOKENS_REPOSITORY)
    private tokenModel: typeof TokenModel,
  ) {}

  async findOrCreate(token: {
    tokenId: string;
    network: string;
    name: string;
    isGlobalToken: boolean;
    totalSupply: bigint | number;
    description: string;
    decimals: number;
    creator: string;
  }): Promise<TokenModel> {
    const [tokenModel]: [TokenModel, boolean] =
      await this.tokenModel.findOrCreate({
        where: { tokenId: token.tokenId.toString(), network: token.network },
        defaults: token,
      });

    return tokenModel;
  }
}
