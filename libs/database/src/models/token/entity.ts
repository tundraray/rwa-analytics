import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tokens',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      name: 'idx_tokens_unique',
      fields: ['tokenId', 'network'],
      unique: true,
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
    type: DataType.STRING(50),
    allowNull: false,
  })
  tokenId!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  network!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isGlobalToken!: boolean;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  totalSupply!: number;

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
    type: DataType.STRING(50),
    allowNull: false,
  })
  creator!: string;
}

export const TOKENS_REPOSITORY = 'TOKENS_REPOSITORY';

export const tokensProviders = [
  {
    provide: TOKENS_REPOSITORY,
    useValue: TokenModel,
  },
];
