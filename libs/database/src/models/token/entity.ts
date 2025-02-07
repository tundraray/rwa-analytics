import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tokens',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_tokens_unique',
      unique: true,
      fields: ['token_id', 'network'],
    },
  ],
})
export class TokenModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'application_id',
  })
  applicationId!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'token_address',
  })
  tokenAddress!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  network!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
  })
  symbol: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'is_global_token',
  })
  isGlobalToken!: boolean;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    field: 'total_supply',
  })
  totalSupply!: bigint;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  decimals!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  creator?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'token_additional_info',
  })
  tokenAdditionalInfo?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_synced_at',
    defaultValue: DataType.NOW,
  })
  lastSyncedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_transaction_at',
    defaultValue: DataType.NOW,
  })
  lastTransactionAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'updated_at',
  })
  updatedAt!: Date;
}

export const TOKENS_REPOSITORY = 'TOKENS_REPOSITORY';

export const tokensProviders = [
  {
    provide: TOKENS_REPOSITORY,
    useValue: TokenModel,
  },
];
