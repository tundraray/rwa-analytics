import { Module } from '@nestjs/common';

import { databaseProviders } from './database.providers';
import {
  TokenService,
  tokensProviders,
  TransactionService,
  transactionsProviders,
} from './models';
import { HolderService, holdersProviders } from './models';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DbModule {}

@Module({
  imports: [DbModule],
  providers: [
    ...tokensProviders,
    ...holdersProviders,
    ...transactionsProviders,
    TokenService,
    HolderService,
    TransactionService,
  ],
  exports: [TokenService, HolderService, TransactionService],
})
export class DatabaseModule {}
