import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { TRANSACTIONS_REPOSITORY } from './entity';
import { TransactionModel } from './entity';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly repository: typeof TransactionModel,
  ) {}

  async createTransaction(transaction: {
    transactionId: string;
    isSwap: boolean;
    date: Date;
    tokenId: number;
    fromAddress: string;
    toAddress: string;
    amount: bigint;
    swapAmount: bigint;
    swapTokenId?: number;
  }): Promise<TransactionModel> {
    const [tr]: [TransactionModel, boolean] =
      await this.repository.findOrCreate({
        where: {
          transactionId: transaction.transactionId,
          tokenId: transaction.tokenId,
        },
        defaults: transaction,
      });

    return tr;
  }
}
