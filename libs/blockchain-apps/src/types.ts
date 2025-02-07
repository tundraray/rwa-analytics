export interface ISyncService {
  syncHolders(): Promise<void>;
  syncTokens(): Promise<void>;
}
