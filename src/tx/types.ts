export interface EnterOptionTxParams {
    marketContractAddress: `0x${string}`;
    selectedOption: bigint;
    buyAmountInWei: bigint;
}

export interface RawTransaction {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
}

export type ApproveTxParams = {
    tokenAddress: `0x${string}`;
    spender: `0x${string}`;
    amount?: bigint; // defaults to max uint256
};

export interface EnterLimitOptionTxParams {
    marketContractAddress: `0x${string}`;           // TradeMarket contract
    selectedOption: number;
    pricePerShare: bigint;     // price per share
    buyAmountInWei: bigint;                 // total buy amount
    tokenDecimals?: number;
}

export interface LimitSellOptionTxParams {
    marketContractAddress: `0x${string}`;           // TradeMarket contract
    selectedOption: number;
    pricePerShare: bigint;     // price per share (0 to 1 float)
    sharesAmountWei: bigint;   // number of shares to sell (votes in contract)
    tokenDecimals?: number;
}

export interface CreateMarketTxParams {
    marketQuestion: string;
    marketOptions: string[];
    marketTags: string[];
    marketDescription: string;
    isPublic: boolean;
    isPublicPoolResolverAi: boolean;
    creator: `0x${string}`; // smartAccount
    startTime: bigint; // unix timestamp (seconds)
    endTime: bigint;   // unix timestamp (seconds)
    no_of_options: bigint; // market options
    disputeTimer: number;
    inputAmountWei: bigint;
    barValues: number[]; // transformedBarValues
    baseToken: `0x${string}`; // TOKEN contract address
    tokenDecimals?: number;
    factoryContractAddress?: `0x${string}`;
    apiUrl?: string;
    rpcUrl?: string;
}

export interface ClaimTxParams {
    marketId: string;
    walletAddress: `0x${string}`;
    apiUrl?: string;
    rpcUrl?: string;
}

export interface CreateDisputeTxParams {
    marketId: string;
    walletAddress: `0x${string}`;
    usdtTokenAddress?: `0x${string}`;
    rainTokenAddress?: `0x${string}`;
    usdtSymbol?: string;
    apiUrl?: string;
    rpcUrl?: string;
}

export interface CreateAppealTxParams {
    marketId: string;
    walletAddress: `0x${string}`;
    usdtTokenAddress?: `0x${string}`;
    rainTokenAddress?: `0x${string}`;
    usdtSymbol?: string;
    apiUrl?: string;
    rpcUrl?: string;
}

export interface CloseMarketTxParams {
    marketId: string;
    walletAddress: `0x${string}`;        // smart account address for allowance checks
    proposedOutcome?: number;            // winner choice index; required for V2 and V3 manual resolver
    usdtTokenAddress?: `0x${string}`;   // required for V3: stablecoin token address
    rainTokenAddress?: `0x${string}`;   // required for V3: RAIN token address
    usdtSymbol?: string;                 // USDT symbol for the current environment (e.g. "USDTm" or "USD₮0")
    tokenDecimals?: number;             // defaults to 6
    apiUrl?: string;
    rpcUrl?: string;
}

export interface OrderToCancel {
    orderType: 'buy' | 'sell';
    option: bigint;       // option index (e.g. 0n for Yes, 1n for No)
    pricePerShare: bigint; // price in 18-decimal wei (same scale as limit order prices)
    orderId: bigint;      // externalID from the open order
}

export interface CancelOrdersTxParams {
    marketContractAddress: `0x${string}`;
    orders: OrderToCancel[];
}

export interface CancelAllOpenOrdersTxParams {
    marketId: string;                        // MongoDB _id — from getMarketById() or getPublicMarkets()
    marketContractAddress: `0x${string}`;   // contract address — for building the cancel tx
    walletAddress: `0x${string}`;
    accessToken: string;                     // Bearer token from Rain auth
    apiUrl?: string;
}

export interface AddLiquidityTxParams {
    marketContractAddress: `0x${string}`;
    walletAddress: `0x${string}`;
    amount: string | number;  // human-readable (e.g. 100). Decimals auto-detected: 6 for USDT, 18 for RAIN.
    rpcUrl?: string;
}

export interface ExtendTimeTxParams {
    marketContractAddress: `0x${string}`;  // TradeMarket contract — resolver() is called on it to get the oracle address
    walletAddress: `0x${string}`;          // smart account address
    accessToken: string;                    // Bearer token from Rain auth
    apiUrl?: string;
    rpcUrl?: string;
}

export interface GetUserOptionSharesParams {
    options: [{ choiceIndex: number, optionName: string }];
    walletAddress: `0x${string}`;
    marketContractAddress: `0x${string}`;
    rpcUrl: string;
}
