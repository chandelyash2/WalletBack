

interface SolanaToken {
  associatedTokenAddress: string;
  mint: string;
  amountRaw: string;
  amount: string;
  decimals: string;
  name: string;
  symbol: string;
  metadata?: any;
  price?: number;
  usdbal?: string;
}

export {
  SolanaToken
};
