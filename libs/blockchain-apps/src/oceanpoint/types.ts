export interface OceanpointTokenModel {
  idProperty: number;
  propertyName: string;
  token: Token;
  propertyStatistic: PropertyStatistic;
  featuredImage: null | string;
  idLicencedIssuer: number | null;
  propertyListingType: PropertyListingType;
  tokenHolders: number;
  propertyStatus: PropertyStatus;
  privacyToggle: boolean;
  startPresale: null;
  endPresale: null;
  startSale: null;
  endSale: null;
  price: null;
  minInvestment: null;
  maxInvestment: null;
}

export enum PropertyListingType {
  Property = 'PROPERTY',
}

export interface PropertyStatistic {
  tokenValuation: number;
  propertyValuation: number;
  availableTokens: number;
  projectedYield: number | null;
  profitDistributed: number;
  averageRevenue: number;
  averageYearlyRevenue: number;
  staticYield: number | null;
  valuation: number;
}

export enum PropertyStatus {
  Listed = 'LISTED',
  Soon = 'SOON',
  Trading = 'TRADING',
}

export interface Token {
  address: string;
  tokenName: string;
  numberOfDecimals: number;
  symbol: string;
  created: Date;
  totalSupply: number;
  numberOfHolders: number;
}
