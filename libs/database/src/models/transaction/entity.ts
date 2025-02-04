import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { TokenModel } from '../token/entity';

@Table({
  tableName: 'transactions',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_transactions_token_id_transaction_id',
      fields: ['tokenId', 'transactionId'],
      unique: true,
    },
  ],
})
export class TransactionModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  date!: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  transactionId!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isSwap!: boolean;

  @ForeignKey(() => TokenModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  tokenId!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  fromAddress!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  toAddress!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  swapAmount?: number;

  @ForeignKey(() => TokenModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  swapTokenId?: number;

  @BelongsTo(() => TokenModel, 'tokenId')
  token!: TokenModel;

  @BelongsTo(() => TokenModel, 'swapTokenId')
  swapToken?: TokenModel;
}

export const TRANSACTIONS_REPOSITORY = 'TRANSACTIONS_REPOSITORY';

export const transactionsProviders = [
  {
    provide: TRANSACTIONS_REPOSITORY,
    useValue: TransactionModel,
  },
];
