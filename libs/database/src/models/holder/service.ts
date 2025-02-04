import { Inject, Injectable } from '@nestjs/common';
import { HolderModel, HOLDERS_REPOSITORY } from './entity';

@Injectable()
export class HolderService {
  deleteEmpty(tokenId: number) {
    return this.holderModel.destroy({ where: { tokenId, balance: 0 } });
  }
  delete(tokenId: number, address: string) {
    // delete  row the holder
    return this.holderModel.destroy({ where: { tokenId, address } });
  }
  constructor(
    @Inject(HOLDERS_REPOSITORY)
    private holderModel: typeof HolderModel,
  ) {}

  async findOrCreate(holder: {
    tokenId: number;
    address: string;
    balance: bigint | number;
    deleted: boolean;
    optedInAtRound?: bigint;
    optedOutAtRound?: bigint;
  }): Promise<HolderModel | null> {
    const holderModel = await this.holderModel.findOne({
      where: { tokenId: holder.tokenId, address: holder.address },
    });
    if (holderModel) {
      return await holderModel.update(holder);
    } else if (holder.balance > 0) {
      return await this.holderModel.create(holder);
    } else {
      return null;
    }
  }
}
