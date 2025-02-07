export interface RealtTokenModel {
  fullName: string;
  shortName: string;
  symbol: string;
  productType: ProductType;
  tokenPrice: number;
  canal: Canal;
  currency: string;
  totalTokens: number;
  totalTokensRegSummed: number;
  uuid: string;
  ethereumContract: null | string;
  xDaiContract: null | string;
  gnosisContract: null | string;
  goerliContract: null | string;
  totalInvestment: number;
  grossRentYear: number;
  grossRentMonth: number;
  propertyManagement: number;
  propertyManagementPercent: number;
  realtPlatform: number;
  realtPlatformPercent: number;
  insurance: number;
  propertyTaxes: number;
  utilities: number;
  initialMaintenanceReserve: number | null;
  netRentDay: number;
  netRentMonth: number;
  netRentYear: number;
  netRentDayPerToken: number;
  netRentMonthPerToken: number;
  netRentYearPerToken: number;
  annualPercentageYield: number;
  coordinate: Coordinate;
  marketplaceLink: string;
  imageLink: string[];
  propertyType: number | null;
  propertyTypeName: PropertyTypeName | null;
  squareFeet: number | null;
  lotSize: number | null;
  bedroomBath: null | string;
  hasTenants: boolean | null;
  rentedUnits: number;
  totalUnits: number | null;
  termOfLease: null;
  renewalDate: null;
  section8paid: number | null;
  subsidyStatus: SubsidyStatus;
  subsidyStatusValue: number | null;
  subsidyBy: SubsidyBy | null;
  sellPropertyTo: SellPropertyTo;
  secondaryMarketplace: PurpleSecondaryMarketplace;
  secondaryMarketplaces: SecondaryMarketplace[];
  blockchainAddresses: BlockchainAddresses;
  underlyingAssetPrice: number | null;
  renovationReserve: number | null;
  propertyMaintenanceMonthly: number;
  rentStartDate: InitialLaunchDateClass | null;
  lastUpdate: InitialLaunchDateClass;
  originSecondaryMarketplaces: SecondaryMarketplace[];
  initialLaunchDate: InitialLaunchDateClass;
  seriesNumber: number;
  constructionYear: number | null;
  constructionType: null | string;
  roofType: null | string;
  assetParking: null | string;
  foundation: null | string;
  heating: null | string;
  cooling: null | string;
  tokenIdRules: number;
  rentCalculationType: RentCalculationType | null;
  realtListingFeePercent: number | null;
  realtListingFee: number | null;
  miscellaneousCosts: number | null;
  propertyStories: number | null;
  rentalType: RentalType | null;
  neighborhood: null | string;
}

export interface BlockchainAddresses {
  ethereum: Ethereum;
  xDai: XDai;
  sepolia: Sepolia;
}

export interface Ethereum {
  chainName: EthereumChainName;
  chainId: number;
  contract: number | string;
  distributor: number | string;
  maintenance: number | string;
}

export enum EthereumChainName {
  Ethereum = 'Ethereum',
  XDaiChain = 'xDaiChain',
}

export interface Sepolia {
  chainName: SepoliaChainName;
  chainId: number;
  contract: number | string;
  distributor: number | string;
  rmmPoolAddress: number;
  chainlinkPriceContract: number | string;
}

export enum SepoliaChainName {
  SepoliaTestnet = 'Sepolia testnet',
}

export interface XDai {
  chainName: EthereumChainName;
  chainId: number;
  contract: number | string;
  distributor: number | string;
  rmmPoolAddress: number | string;
  rmmV3WrapperAddress: string | number;
  chainlinkPriceContract: number | string;
}

export enum Canal {
  ExitComplete = 'exit_complete',
  OfferingClosed = 'offering_closed',
  Release = 'release',
  TokensMigrated = 'tokens_migrated',
}

export interface Coordinate {
  lat: string;
  lng: string;
}

export enum Currency {
  Usd = 'USD',
}

export interface InitialLaunchDateClass {
  date: Date;
  timezone_type: number;
  timezone: Timezone;
}

export enum Timezone {
  UTC = 'UTC',
}

export interface SecondaryMarketplace {
  chainId: number;
  chainName: EthereumChainName;
  dexName: DexName;
  contractPool: string;
  pair?: Pair;
}

export enum DexName {
  LevinSwap = 'LevinSwap',
  UniswapV1 = 'UniswapV1',
  UniswapV2 = 'UniswapV2',
}

export interface Pair {
  contract: Contract;
  symbol: Symbol;
  name: Name;
}

export enum Contract {
  The0X1698Cd22278Ef6E7C0Df45A8Dea72Edbea9E42Aa = '0x1698cd22278ef6e7c0df45a8dea72edbea9e42aa',
  The0X5162D60B699A44B9F09B5Fbfd8E6343Cde9D7B22 = '0x5162d60b699a44b9f09b5fbfd8e6343cde9d7b22',
  The0X6A023Ccd1Ff6F2045C3309768Ead9E68F978F6E1 = '0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1',
  The0X6F5258Feb5862B661829315841B0718D6E56Ca2C = '0x6f5258feb5862b661829315841b0718d6e56ca2c',
  The0X7Dfeee178Fc1F929A88Ad69E4E8D493600Dd26D0 = '0x7dfeee178fc1f929a88ad69e4e8d493600dd26d0',
  The0Xc02Aaa39B223Fe8D0A0E5C4F27Ead9083C756Cc2 = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  The0Xc1C1031E4A44B98707203480029E6576Cb3267E3 = '0xc1c1031e4a44b98707203480029e6576cb3267e3',
  The0Xddafbb505Ad214D7B80B1F830Fccc89B60Fb7A83 = '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83',
}

export enum Name {
  Levin = 'Levin',
  RealTokenS11898LaingStDetroitMI = 'RealToken S 11898 Laing St Detroit MI',
  RealTokenS128EWeberStToledoOH = 'RealToken S 128 E Weber St Toledo OH',
  RealTokenS14117ManningStDetroitMI = 'RealToken S 14117 Manning St Detroit MI',
  RealTokenS20257MonicaStDetroitMI = 'RealToken S 20257 Monica St Detroit MI',
  USDCOnXDai = 'USD//C on xDai',
  WrappedEther = 'Wrapped Ether',
  WrappedEtherOnXDai = 'Wrapped Ether on xDai',
}

export enum Symbol {
  Levin = 'LEVIN',
  RealTokenS11898LaingStDetroitMI = 'RealToken S 11898 Laing St Detroit MI',
  RealTokenS20257MonicaStDetroitMI = 'RealToken S 20257 Monica St Detroit MI',
  RealtokenS128EWeberStToledoOh = 'REALTOKEN-S-128-E-WEBER-ST-TOLEDO-OH',
  RealtokenS14117ManningStDetroitMi = 'REALTOKEN-S-14117-MANNING-ST-DETROIT-MI',
  Usdc = 'USDC',
  Weth = 'WETH',
}

export enum ProductType {
  EquityToken = 'equity_token',
  LoanIncome = 'loan_income',
  RealEstateRental = 'real_estate_rental',
}

export enum PropertyTypeName {
  Commercial = 'Commercial',
  Condominium = 'Condominium',
  Duplex = 'Duplex',
  MFRPortfolio = 'MFR Portfolio',
  MixedUse = 'Mixed-Use',
  MultiFamily = 'Multi Family',
  Quadplex = 'Quadplex',
  SFRPortfolio = 'SFR Portfolio',
  SingleFamily = 'Single Family',
  Triplex = 'Triplex',
}

export enum RentCalculationType {
  Average = 'average',
  Constant = 'constant',
}

export enum RentalType {
  LongTerm = 'long_term',
  PreConstruction = 'pre_construction',
  ShortTerm = 'short_term',
}

export interface PurpleSecondaryMarketplace {
  UniswapV1: boolean | number;
  UniswapV2: number | string;
}

export enum SellPropertyTo {
  IntlInvestorsOnly = 'intl_investors_only',
  UsInvestorsOnly = 'us_investors_only',
}

export enum SubsidyBy {
  Section42 = 'Section 42',
  Section8 = 'Section 8',
  StateOfMichigan = 'State of Michigan',
}

export enum SubsidyStatus {
  No = 'no',
  Partial = 'partial',
  Yes = 'yes',
}
