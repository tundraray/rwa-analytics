import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { TokenModel } from '../token';

@Table({
  tableName: 'holders',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_holders_token_id',
      fields: ['token_id'],
    },
    {
      name: 'idx_holders_address_token_id',
      unique: true,
      fields: ['address', 'token_id'],
    },
  ],
})
export class HolderModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => TokenModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'token_id',
  })
  tokenId!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  address!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  url?: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  balance!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'last_synced_at',
  })
  lastSyncedAt!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  deleted!: boolean;

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

  @BelongsTo(() => TokenModel)
  token!: TokenModel;
}

export const HOLDERS_REPOSITORY = 'HOLDERS_REPOSITORY';

export const holdersProviders = [
  {
    provide: HOLDERS_REPOSITORY,
    useValue: HolderModel,
  },
];
