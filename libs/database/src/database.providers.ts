import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DATE } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { HolderModel, TokenModel } from './models';
import { TransactionModel } from './models';

DATE.prototype._stringify = function _stringify(date, options) {
  date = this._applyTimezone(date, options);

  return date.format('YYYY-MM-DD HH:mm:ss.SSS') as string;
};

export const SEQUELIZE = 'SEQUELIZE';
export const databaseProviders = [
  {
    provide: SEQUELIZE,
    inject: [ConfigService],
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService): Promise<Sequelize> => {
      const sequelize: Sequelize = new Sequelize(
        configService.getOrThrow('DB_NAME'),
        configService.getOrThrow('DB_USERNAME'),
        configService.getOrThrow('DB_PASSWORD'),
        {
          host: configService.getOrThrow('DB_HOST'),
          dialect: 'postgres',
          logging: configService.get<boolean>('SQL_LOG', false)
            ? (msg) => new Logger(Sequelize.name).debug(msg)
            : false,
          retry: {
            match: [
              /SequelizeConnectionError/,
              /SequelizeConnectionRefusedError/,
              /SequelizeHostNotFoundError/,
              /SequelizeHostNotReachableError/,
              /SequelizeInvalidConnectionError/,
              /SequelizeConnectionTimedOutError/,
              /TimeoutError/,
              /SequelizeConnectionAcquireTimeoutError/,
            ],
            max: 5,
          },
          pool: {
            max: 5, // больше соединений
            min: 0, // держим минимум соединений
            acquire: 60000,
            idle: 10000,
            maxUses: Infinity,
          },
        },
      );

      sequelize.addModels([TokenModel, HolderModel, TransactionModel]);
      await sequelize.sync();

      return sequelize;
    },
  },
];
