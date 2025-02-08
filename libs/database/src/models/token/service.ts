import { Inject, Injectable } from '@nestjs/common';
import { TokenModel, TOKENS_REPOSITORY } from './entity';
import { Op } from 'sequelize';

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

  async findOrCreate(token: Partial<TokenModel>): Promise<TokenModel> {
    const [tokenModel, created]: [TokenModel, boolean] =
      await this.tokenModel.findOrCreate({
        where: {
          tokenAddress: token.tokenAddress,
          network: token.network,
        },
        defaults: token,
      });

    if (!created) {
      await tokenModel.update(token);
    }

    return tokenModel;
  }

  async listLastSyncedTokens(applicationId: number) {
    const tokens = await this.tokenModel.findAll({
      where: {
        applicationId,
        lastSyncedAt: { [Op.lt]: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      },
      order: [['lastSyncedAt', 'DESC']],
      limit: 100,
    });
    return tokens;
  }

  async updateLastSyncedAt(id: number) {
    await this.tokenModel.update(
      { lastSyncedAt: new Date() },
      { where: { id } },
    );
  }
}
