export interface ReentalResponse {
  data: Data;
  extensions: Extensions;
}

export interface Data {
  getPublicProperties: GetPublicProperties;
}

export interface GetPublicProperties {
  __typename: string;
  items: Item[];
  metadata: Metadata;
}

export interface Item {
  externalStatus: Status;
  _id: string;
  name: string;
  slug: string;
  status: Status;
  description_es: string;
  description_en: string;
  images: DocsEn[];
  address: string;
  locality: string;
  administrative_area_level_2: string;
  administrative_area_level_1: string;
  country: Country;
  geo: Geo;
  tokenPrice: Amount;
  amount: Amount;
  minInvestmentTokens: null;
  netYearlyBenefit: Amount;
  emittedTokens: number;
  saleProfitability: number;
  apr: number;
  gains: number;
  netSale: number;
  aprNetSale: number;
  starts_on: Date;
  closingDate: Date | null;
  dividends_starts_on: Date;
  dividends: number;
  tokenName: string;
  investmentDuration: InvestmentDuration;
  typeOfSale: TypeOfSale;
  docs_es: DocsEn[];
  docs_en: DocsEn[];
  token: Token;
  whitelist: Whitelist;
}

export interface Amount {
  value: number;
  currency: Currency;
}

export enum Currency {
  Eur = 'EUR',
  Usd = 'USD',
}

export enum Country {
  Arg = 'ARG',
  DOM = 'DOM',
  Esp = 'ESP',
  Mex = 'MEX',
  Usa = 'USA',
}

export interface DocsEn {
  id: string;
  name: string;
  type: string;
  size: number;
  keyS3: string;
  url: string;
  title?: Title;
}

export enum Title {
  Agreement = 'AGREEMENT',
  Empty = '',
  Whitepaper = 'WHITEPAPER',
}

export enum Status {
  Closed = 'CLOSED',
  Listed = 'LISTED',
  Renovating = 'RENOVATING',
  Sold = 'SOLD',
}

export interface Geo {
  lat: number;
  lng: number;
}

export interface InvestmentDuration {
  value: number;
  period: Period;
}

export enum Period {
  Months = 'MONTHS',
  Years = 'YEARS',
}

export interface Token {
  id: string;
  hashId: string;
  whitelistId: string;
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  maxSupply: string;
  reservedSupply: string;
  nWallets: number;
  price: number;
  wallets: string[];
  status: Status;
  sold: string;
}

export enum TypeOfSale {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
}

export interface Whitelist {
  _id: string;
  name: Name;
  hashId: string;
  tokens: null;
  wallets: null;
  isGlobal: null;
}

export enum Name {
  España = 'España',
  Global = 'Global',
}

export interface Metadata {
  numElements: number;
  offset: number;
  limit: number;
  page: number;
  pages: number;
  orderBy: string;
  orderDirection: string;
}

export interface Extensions {
  tracing: Tracing;
}

export interface Tracing {
  version: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  execution: Execution;
}

export interface Execution {
  resolvers: any[];
}
