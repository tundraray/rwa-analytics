import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { TokenModel } from '../token/entity';

@Table({
  tableName: 'holders',
  underscored: true,
  indexes: [
    {
      fields: ['address', 'token_id'],
      unique: true,
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
  })
  tokenId!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  address!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  balance!: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    field: 'optedinatround',
  })
  optedInAtRound: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    field: 'optedoutatround',
  })
  optedOutAtRound: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  deleted: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
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
