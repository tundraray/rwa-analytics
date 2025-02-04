/* eslint-disable @typescript-eslint/no-unsafe-return */
import { HolderService, TokenService, TransactionService } from '@app/database';
import { Injectable } from '@nestjs/common';
import { Indexer } from 'algosdk';
import { Transaction } from 'algosdk/dist/types/client/v2/indexer/models/types';
import Bottleneck from 'bottleneck';
import { setGlobalDispatcher, Agent } from 'undici';

setGlobalDispatcher(
  new Agent({
    connect: {
      rejectUnauthorized: false,
    },
  }),
);

type Operation = {
  sender: string;
  receiver: string;
  amount: bigint;
  assetId?: bigint;
};

const INDEXER_API_URL = 'https://mainnet-idx.4160.nodely.dev';
const LoftyAddress =
  'LOFTYRITC3QUX6TVQBGT3BARKWAZDEB2TTJWYQMH6YITKNH7IOMWRLC7SA';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

@Injectable()
export class LoftyService {
  private indexerClient: Indexer;
  private limiter: Bottleneck;
  private indexerLimiter: Bottleneck;
  constructor(
    private readonly tokenService: TokenService,
    private readonly holderService: HolderService,
    private readonly transactionService: TransactionService,
  ) {
    this.indexerClient = new Indexer('', INDEXER_API_URL, '');
    this.limiter = new Bottleneck({
      maxConcurrent: 20,
      minTime: 10,
    });
    this.indexerLimiter = new Bottleneck({
      maxConcurrent: 20,
      minTime: 20,
    });
  }
  private serializeResponse(data: any) {
    return JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async getTransaction(
    txId: string = 'ADXFCI56MPURVOZ4RN2TKKUNU2LOSHROXNZGO7D3DGO6JH3U3KGQ',
  ) {
    const tx = await this.getGroupId(txId);
    const groupId = Buffer.from(tx.group || '').toString('base64');
    await this.parseTransactionGroup(groupId, tx.block || BigInt(0));
  }

  async updateLofty() {
    const createdAssets = await this.getCreatedAssets(LoftyAddress);
    return Promise.all(
      createdAssets
        ?.filter((asset) => asset.id !== '237267329')
        .map(async (clientAsset) => {
          return this.limiter.schedule(async () => {
            const decimals = clientAsset.decimals;
            const totalSupply = BigInt(clientAsset.total) || BigInt(0);
            const token = await this.tokenService.findOrCreate({
              tokenId: clientAsset.id.toString(),
              network: 'algorand',
              name: clientAsset.name,
              isGlobalToken: false,
              totalSupply:
                decimals > 0
                  ? totalSupply / BigInt(10 ** decimals)
                  : totalSupply,
              description: '',
              decimals: clientAsset.decimals,
              creator: clientAsset.creator,
            });
            await this.getAllAssetHolders(token.id, clientAsset.id);
            await this.getAllAssetTransactions(token.id, clientAsset.id);
          });
        }) ?? [],
    );
  }

  async getAllAssetTransactions(tokenId: number, assetId: string) {
    let nextToken: string | undefined = undefined;
    try {
      do {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 2);
        const response = await this.indexerLimiter.schedule(async () => {
          const query = this.indexerClient
            .lookupAssetTransactions(BigInt(assetId))
            .afterTime(oneYearAgo)
            .limit(1000);
          if (nextToken) {
            query.nextToken(nextToken);
          }

          return await query.do();
        });
        await Promise.all(
          response.transactions.map(async (trx) => {
            if (trx.group && trx.confirmedRound) {
              const groupId = Buffer.from(trx.group || '').toString('base64');
              await this.parseTransactionGroup(groupId, trx.confirmedRound);
            } else {
              // console.log('no group', trx.id);
            }
          }),
        );

        nextToken = response.nextToken;
      } while (nextToken);
    } catch (error) {
      console.error('Error fetching all asset transactions:', error);
      throw error;
    }
  }

  async getAllAssetHolders(tokenId: number, assetId: string) {
    let nextToken: string | undefined = undefined;
    try {
      do {
        const response = await this.indexerLimiter.schedule(async () => {
          const query = this.indexerClient
            .lookupAssetBalances(BigInt(assetId))
            .currencyGreaterThan(0)
            .limit(1000);
          if (nextToken) {
            query.nextToken(nextToken);
          }

          return await query.do();
        });
        await Promise.all(
          response.balances.map(async (balance) => {
            if (balance.address !== LoftyAddress)
              await this.holderService.findOrCreate({
                tokenId: tokenId,
                address: balance.address,
                balance: BigInt(balance.amount),
                deleted: balance.deleted ?? false,
                optedInAtRound: balance.optedInAtRound,
                optedOutAtRound: balance.optedOutAtRound,
              });
          }),
        );

        nextToken = response.nextToken;
      } while (nextToken);
      await this.holderService.deleteEmpty(tokenId);
    } catch (error) {
      console.error('Error fetching all asset holders:', error);
      throw error;
    }
  }

  async getCreatedAssets(creatorAddress: string) {
    try {
      const assets: {
        id: string;
        name: string;
        total: string;
        decimals: number;
        creator: string;
        url?: string;
      }[] = [];
      let nextToken = '';

      do {
        const response = await this.limiter.schedule(async () => {
          const query = this.indexerClient
            .searchForAssets()
            .creator(creatorAddress)
            .limit(1000);

          if (nextToken) {
            query.nextToken(nextToken);
          }

          return await query.do();
        });

        assets.push(
          ...response.assets.map((asset) => ({
            id: asset.index.toString(),
            name: asset.params.name ?? '',
            total: asset.params.total.toString(),
            decimals: asset.params.decimals,
            creator: asset.params.creator,
            url: asset.params.url,
          })),
        );

        nextToken = response.nextToken ?? '';
      } while (nextToken);

      return assets;
    } catch (error) {
      console.error('Error fetching created assets:', error);
      throw error;
    }
  }

  async parseTransactionGroup(groupId: string, blockId: bigint) {
    try {
      const transactions = await this.indexerLimiter.schedule(async () => {
        return await this.indexerClient
          .searchForTransactions()

          .round(blockId)
          .do();
      });
      const finded = transactions.transactions.filter(
        (tx) => Buffer.from(tx.group || '').toString('base64') === groupId,
      );

      const parsed = this.parseAlgorandTransactions(finded, blockId, groupId);
      if (parsed && parsed.sender && parsed.senderAssetId) {
        const token = await this.getTokenId(parsed.senderAssetId);
        const swapToken = parsed.receiverAssetId
          ? await this.getTokenId(parsed.receiverAssetId)
          : null;
        await this.transactionService.createTransaction({
          transactionId: parsed.id,
          date: parsed.date,
          isSwap: true,
          tokenId: token.id,
          fromAddress: parsed.sender,
          toAddress: parsed.receiver,
          amount: parsed.senderAmount,
          swapAmount: parsed.receiverAmount,
          swapTokenId: swapToken?.id,
        });
      } else {
        console.log('no sender', groupId, blockId, parsed);
      }
    } catch (error) {
      console.error(
        'Error fetching transaction group:',
        groupId,
        blockId,
        error,
      );
      throw error;
    }
  }
  async getTokenId(receiverAssetId: string) {
    const token = await this.tokenService.getTokenByTokenId(
      receiverAssetId,
      'algorand',
    );
    if (!token) {
      const clientAsset = await this.indexerClient
        .lookupAssetByID(BigInt(receiverAssetId))
        .do();
      const decimals = clientAsset.asset.params.decimals;
      const totalSupply = BigInt(clientAsset.asset.params.total) || BigInt(0);
      return await this.tokenService.findOrCreate({
        tokenId: receiverAssetId,
        network: 'algorand',
        name: clientAsset.asset.params.name || '',
        isGlobalToken: false,
        totalSupply:
          decimals > 0 ? totalSupply / BigInt(10 ** decimals) : totalSupply,
        description: '',
        decimals: clientAsset.asset.params.decimals,
        creator: clientAsset.asset.params.creator,
      });
    }
    return token;
  }

  async getGroupId(txId: string) {
    try {
      const tx = await this.indexerClient.lookupTransactionByID(txId).do();

      return {
        group: tx.transaction.group,
        block: tx.transaction.confirmedRound,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  private getTotalAmountByAsset(
    tx: Transaction,
    i: number = 0,
  ): Record<string, Operation> {
    const assetTransfers: Record<string, Operation> = {};
    // Add main transaction amount
    const { sender } = tx;
    if (tx.paymentTransaction) {
      const { amount, receiver } = tx.paymentTransaction;
      const key = `${i}-${sender}-${receiver}`;
      assetTransfers[key] = {
        sender,
        receiver,
        amount,
      };
    }
    if (tx.assetTransferTransaction) {
      const { amount, assetId, receiver } = tx.assetTransferTransaction;
      const key = `${i}-${sender}-${receiver}-${assetId}`;

      if (!assetTransfers[key]) {
        assetTransfers[key] = {
          sender,
          receiver,
          amount,
          assetId,
        };
      } else {
        assetTransfers[key].amount += amount;
      }
    }

    // Add inner transactions amounts recursively
    if (tx.innerTxns) {
      tx.innerTxns.forEach((innerTx: any) => {
        const innerAmounts = this.getTotalAmountByAsset(innerTx, ++i);
        Object.entries(innerAmounts).forEach(([assetId, tx]) => {
          if (assetTransfers[assetId]) {
            assetTransfers[assetId].amount += tx.amount;
          } else {
            assetTransfers[assetId] = tx;
          }
        });
      });
    }

    return assetTransfers;
  }

  parseAlgorandTransactions(
    transactions: Transaction[],
    blockId: bigint,
    groupId: string,
  ): any {
    const txId = `${blockId}:${groupId}`;
    const assetTransfers: Record<string, Operation> = {};

    if (transactions.length === 0) return null;

    const date = transactions[0].roundTime
      ? new Date(transactions[0].roundTime * 1000)
      : undefined;
    if (transactions.length === 1 && !transactions[0].innerTxns) {
      const amounts = this.getTotalAmountByAsset(transactions[0]);
      const operation = Object.values(amounts)[0];
      return {
        id: txId,
        date,
        sender: transactions[0].sender,
        senderAssetId: operation.assetId,
        senderAmount: operation.amount,
        receiver: operation.receiver,
        receiverAssetId: operation.assetId,
        receiverAmount: operation.amount,
      };
    }

    transactions.forEach((tx) => {
      const amounts = this.getTotalAmountByAsset(tx);
      Object.entries(amounts).forEach(([assetId, amount]) => {
        assetTransfers[assetId] = amount;
      });
    });

    const operations = Object.values(assetTransfers);

    let from: Operation = {} as Operation;
    let to: Operation = {} as Operation;

    operations.forEach((operation) => {
      if (!from.assetId) {
        from = operation;
      } else {
        if (operation.assetId === from.assetId) {
          if (from.amount < operation.amount) {
            from.receiver = operation.receiver;
            from.sender = operation.sender;
          }
          from.amount += operation.amount;
        } else {
          if (!to.assetId) {
            to = operation;
          } else {
            if (to.amount < operation.amount) {
              to.receiver = operation.receiver;
              to.sender = operation.sender;
            }
            to.amount += operation.amount;
          }
        }
      }
    });

    return {
      id: txId,
      date,
      sender: from.sender,
      senderAssetId: from.assetId,
      senderAmount: from.amount,
      receiver: to.sender || from.receiver,
      receiverAssetId: to.assetId || from.assetId,
      receiverAmount: to.amount || from.amount,
    };
  }
}
