# Rain SDK Documentation

## Overview

Rain SDK is designed as a **clean, modular, and extensible TypeScript SDK** for interacting with Rain markets and preparing on-chain transactions.

The SDK is intentionally split into two layers:

* **Rain** → Stateless, public-facing utilities (data fetching, raw transaction builders)
* **RainAA** → Stateful Account Abstraction layer (smart accounts)

---

## Installation

```bash
npm install @rainprotocolsdk/sdk
```

or

```bash
yarn add @rainprotocolsdk/sdk
```

---

### Initialization

```ts
import { Rain } from "@rainprotocolsdk/sdk";

const rain = new Rain();
```

### Constructor Parameters

```ts
interface RainCoreConfig {
  environment?: "development" | "stage" | "production"; // default: "development"
  rpcUrl?: string; // optional custom RPC URL
}
```

---

## login

Authenticates a user against the Rain backend using a wallet signature and returns a JWT access token.

The caller is responsible for signing the message — pass the resulting signature along with the wallet addresses.

### Method Signature

```ts
login(params: LoginParams): Promise<LoginResult>
```

### Parameters

```ts
interface LoginParams {
  signature: string;          // personal_sign of the lowercased wallet address
  walletAddress: string;      // EOA wallet address
  smartWalletAddress: string; // Smart account / AA wallet address
  referredBy?: string;        // Optional referral code
}
```

### Return Type

```ts
interface LoginResult {
  accessToken: string; // JWT token for authenticated API calls
  userId: string;      // Backend user ID
}
```

### Example

```ts
// 1. Sign the message with your wallet provider
const signature = await walletClient.signMessage({
  message: walletAddress.toLowerCase(),
});

// 2. Login
const { accessToken, userId } = await rain.login({
  signature,
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  smartWalletAddress: "0xSmartAccountAddress...",
  referredBy: "REFCODE123", // optional
});
```

---

## getPublicMarkets

Fetches public market data from the Rain backend.

### Method Signature

```ts
getPublicMarkets(params: GetMarketsParams): Promise<Market[]>;
```

### Parameters

```ts
interface GetMarketsParams {
  limit?: number;
  offset?: number;
  sortBy?: "Liquidity" | "Volumn" | "latest";
  status?: 'Live' | 'New' | 'WaitingForResult' | 'UnderDispute' | 'UnderAppeal' | 'ClosingSoon' | 'InReview' | 'InEvaluation' | 'Closed' | 'Trading';
}
```

### Example

```ts
const markets = await rain.getPublicMarkets({
  limit: 12,
  offset: 1,
  sortBy: "Liquidity",
  status: "Live",
});
```

---

## getMarketById

Fetches a single market by its ID from the Rain backend.

### Method Signature

```ts
getMarketById(params: GetMarketByIdParams): Promise<Market>
```

### Parameters

```ts
interface GetMarketByIdParams {
  marketId: string; // MongoDB _id of the market
}
```

### Validations

| Parameter  | Type     | Required | Description            |
| ---------- | -------- | -------- | ---------------------- |
| `marketId` | `string` | ✅        | Unique market `_id`    |

### Example

```ts
const market = await rain.getMarketById({
  marketId: "698c8f116e985bbfacc7fc01",
});
```

---

## getUserInvestments

Fetches a user's invested markets from the Rain backend. Requires a valid access token.

### Method Signature

```ts
getUserInvestments(params: GetUserInvestmentsParams): Promise<UserInvestment[]>
```

### Parameters

```ts
interface GetUserInvestmentsParams {
  walletAddress: string;  // User's wallet address
  accessToken: string;    // JWT from Rain auth (login)
  limit?: number;
  offset?: number;
  status?: 'Live' | 'New' | 'WaitingForResult' | 'UnderDispute' | 'UnderAppeal' | 'ClosingSoon' | 'InReview' | 'InEvaluation' | 'Closed' | 'Trading';
}
```

### Validations

| Parameter       | Type          | Required | Description                          |
| --------------- | ------------- | -------- | ------------------------------------ |
| `walletAddress` | `string`      | ✅        | The user's wallet address            |
| `accessToken`   | `string`      | ✅        | JWT returned from `login()`          |
| `limit`         | `number`      | ❌        | Number of results per page           |
| `offset`        | `number`      | ❌        | Pagination offset                    |
| `status`        | `MarketStatus`| ❌        | Filter by market status              |

### Example

```ts
const investments = await rain.getUserInvestments({
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  accessToken: "eyJhbGciOi...",
  limit: 10,
  offset: 1,
  status: "Live",
});
```

---

## buildApprovalTx

Builds a raw ERC20 approval transaction if needed.

This function prepares an unsigned `approve(spender, amount)` transaction and does not execute it.

If `amount` is not provided, a default large allowance is approved.

### Return Type

```ts
interface RawTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
}
```

### Example

```ts
const approvalTx = rain.buildApprovalTx({
  tokenAddress: "0xTokenAddress...",  // ERC20 token address
  spender: "0xMarketContractAddress...", // Market contract address
  amount: 1000000000000000000n // optional
});
```

---

## buildBuyOptionRawTx

Builds a **raw EVM transaction** for entering a market option.

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildBuyOptionRawTx(params: EnterOptionTxParams): RawTransaction;
```

### Parameters

```ts
interface EnterOptionTxParams {
  marketContractAddress: `0x${string}`; // TradeMarket contract address
  selectedOption: bigint;               // Option index
  buyAmountInWei: bigint;               // Amount in wei
}
```

### Return Type

```ts
interface RawTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
}
```

### Example

```ts
const rawTx = rain.buildBuyOptionRawTx({
  marketContractAddress: "0xMarketContractAddress...",
  selectedOption: 1n,
  buyAmountInWei: 1000000n,
});
```

---

## buildLimitBuyOptionTx

Builds a **raw EVM transaction** for placing a limit buy order on a Rain market.

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildLimitBuyOptionTx(params: EnterLimitOptionTxParams): RawTransaction
```

### Parameters

```ts
interface EnterLimitOptionTxParams {
  marketContractAddress: `0x${string}`; // Market contract address
  selectedOption: number;               // Option index
  pricePerShare: number;                // Limit price per share (between 0 and 1)
  buyAmountInWei: bigint;               // Total buy amount in token wei
  tokenDecimals?: number;               // Token decimals (default: 6)
}
```

### Validations

| Field                   | Type          | Required | Description                                            |
| ----------------------- | ------------- | -------- | ------------------------------------------------------ |
| `marketContractAddress` | `0x${string}` | ✅        | Address of the market contract                         |
| `selectedOption`        | `number`      | ✅        | Option index to place the buy order for                |
| `pricePerShare`         | `number`      | ✅        | Limit price per share (between `0` and `1`)            |
| `buyAmountInWei`        | `bigint`      | ✅        | Total amount to spend (already converted to token wei) |
| `tokenDecimals`         | `number`      | ❌        | Token decimals (default: `6`)                          |

### Return Type

```ts
interface RawTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
}
```

### Example

```ts
rain.buildLimitBuyOptionTx({
  marketContractAddress: "0xMarketContractAddress...",
  selectedOption: 1,
  pricePerShare: 0.6,
  buyAmountInWei: 1000000n,
});
```

---

## buildLimitSellOptionTx

Builds a **raw EVM transaction** for placing a limit sell order on a Rain market.

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildLimitSellOptionTx(params: LimitSellOptionTxParams): RawTransaction
```

### Parameters

```ts
interface LimitSellOptionTxParams {
  marketContractAddress: `0x${string}`; // Market contract address
  selectedOption: number;               // Option index
  pricePerShare: number;                // Limit price per share (between 0 and 1)
  sharesAmountWei: bigint;              // Number of shares to sell (in wei)
  tokenDecimals?: number;               // Token decimals (default: 6)
}
```

### Validations

| Field                   | Type          | Required | Description                                 |
| ----------------------- | ------------- | -------- | ------------------------------------------- |
| `marketContractAddress` | `0x${string}` | ✅        | Address of the market contract              |
| `selectedOption`        | `number`      | ✅        | Option index to place the sell order for    |
| `pricePerShare`         | `number`      | ✅        | Limit price per share (between `0` and `1`) |
| `sharesAmountWei`       | `bigint`      | ✅        | Number of shares to sell (must be `> 0`)    |
| `tokenDecimals`         | `number`      | ❌        | Token decimals (default: `6`)               |

### Return Type

```ts
interface RawTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
}
```

### Example

```ts
rain.buildLimitSellOptionTx({
  marketContractAddress: "0xMarketContractAddress...",
  selectedOption: 0,
  pricePerShare: 0.4,
  sharesAmountWei: 500000n,
});
```

---

## buildCancelOrdersTx

Builds **raw EVM transactions** to cancel specific open orders on a Rain market.

Groups orders by type and returns up to two transactions — one for sell orders (`cancelSellOrders`) and one for buy orders (`cancelBuyOrders`).

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildCancelOrdersTx(params: CancelOrdersTxParams): RawTransaction[]
```

### Parameters

```ts
interface OrderToCancel {
  orderType: 'buy' | 'sell';
  option: bigint;        // Option index (e.g. 0n for Yes, 1n for No)
  pricePerShare: bigint; // Price in 18-decimal wei
  orderId: bigint;       // externalID from the open order
}

interface CancelOrdersTxParams {
  marketContractAddress: `0x${string}`;
  orders: OrderToCancel[];
}
```

### Validations

| Field                   | Type             | Required | Description                           |
| ----------------------- | ---------------- | -------- | ------------------------------------- |
| `marketContractAddress` | `0x${string}`    | ✅        | Address of the market contract        |
| `orders`                | `OrderToCancel[]`| ✅        | Non-empty array of orders to cancel   |

### Return Type

```ts
RawTransaction[] // 1 tx if only buy or only sell; 2 txs if both
```

### Example

```ts
const txs = rain.buildCancelOrdersTx({
  marketContractAddress: "0xMarketContractAddress...",
  orders: [
    {
      orderType: "buy",
      option: 0n,
      pricePerShare: 600000000000000000n, // 0.6 in 18 decimals
      orderId: 42n,
    },
    {
      orderType: "sell",
      option: 1n,
      pricePerShare: 400000000000000000n,
      orderId: 43n,
    },
  ],
});
```

---

## buildCancelAllOpenOrdersTx

Fetches all open orders for a wallet on a given market from the Rain backend and builds the cancel transactions automatically.

Returns an empty array if no open orders exist.

### Method Signature

```ts
buildCancelAllOpenOrdersTx(params: CancelAllOpenOrdersTxParams): Promise<RawTransaction[]>
```

### Parameters

```ts
interface CancelAllOpenOrdersTxParams {
  marketId: string;                      // MongoDB _id of the market
  marketContractAddress: `0x${string}`; // Market contract address
  walletAddress: `0x${string}`;         // User's wallet address
  accessToken: string;                   // JWT from Rain auth (login)
}
```

### Validations

| Field                   | Type          | Required | Description                          |
| ----------------------- | ------------- | -------- | ------------------------------------ |
| `marketId`              | `string`      | ✅        | MongoDB `_id` from market data       |
| `marketContractAddress` | `0x${string}` | ✅        | Market contract address              |
| `walletAddress`         | `0x${string}` | ✅        | Wallet address of the user           |
| `accessToken`           | `string`      | ✅        | JWT returned from `login()`          |

### Return Type

```ts
RawTransaction[] // empty array if no open orders found
```

### Example

```ts
const txs = await rain.buildCancelAllOpenOrdersTx({
  marketId: "698c8f116e985bbfacc7fc01",
  marketContractAddress: "0xMarketContractAddress...",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  accessToken: "eyJhbGciOi...",
});
```

---

## buildCreateMarketTx

Builds a **raw EVM transaction** for creating a market in Rain Protocol.

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildCreateMarketTx(params: CreateMarketTxParams): Promise<RawTransaction[]>
```

### Parameters

```ts
interface CreateMarketTxParams {
  marketQuestion: string;
  marketOptions: string[];
  marketTags: string[];
  marketDescription: string;
  isPublic: boolean;
  isPublicPoolResolverAi: boolean;
  creator: `0x${string}`;
  startTime: bigint;         // Unix timestamp (seconds)
  endTime: bigint;           // Must be > startTime
  no_of_options: bigint;     // Number of options (>= 2)
  inputAmountWei: bigint;    // Initial liquidity (token wei)
  barValues: number[];       // Token distribution per option in %
  baseToken: `0x${string}`; // ERC20 token address
  tokenDecimals?: number;    // Optional (default: 6)
}
```

### Validations

| Field                    | Type               | Required | Description                                |
| ------------------------ | ------------------ | -------- | ------------------------------------------ |
| `marketQuestion`         | `string`           | ✅        | Market question (cannot be empty)          |
| `marketOptions`          | `string[]`         | ✅        | List of options (2 to 26)                  |
| `marketTags`             | `string[]`         | ✅        | Tags related to the market (1 to 3)        |
| `marketDescription`      | `string`           | ✅        | Detailed market description                |
| `isPublic`               | `boolean`          | ✅        | Whether market is public                   |
| `isPublicPoolResolverAi` | `boolean`          | ✅        | AI resolver flag                           |
| `creator`                | `0x${string}`      | ✅        | Market creator address                     |
| `startTime`              | `bigint`           | ✅        | Market start timestamp                     |
| `endTime`                | `bigint`           | ✅        | Must be greater than `startTime`           |
| `no_of_options`          | `bigint`           | ✅        | Number of market options (>= 2)            |
| `inputAmountWei`         | `bigint`           | ✅        | Initial liquidity (minimum 10 tokens)      |
| `barValues`              | `number[]`         | ✅        | Cannot be empty                            |
| `baseToken`              | `0x${string}`      | ✅        | ERC20 base token address                   |
| `tokenDecimals`          | `number`           | ❌        | Defaults to `6`                            |

### Minimum Liquidity Rule

#### inputAmountWei >= 10 tokens

### Return Type

```ts
RawTransaction[] // [approve, createMarket] or [createMarket] depending on allowance
```

### Note

If the user has not approved the **Rain Factory contract**, the function will return two transactions **(approve + create market)**, but if approval already exists, it will return only one transaction **(create market)**.

### Example

```ts
const txs = await rain.buildCreateMarketTx({
  marketQuestion: "Will BTC hit 100k?",
  marketOptions: ["Yes", "No"],
  marketTags: ["crypto", "bitcoin"],
  marketDescription: "Prediction market for BTC price",
  isPublic: true,
  isPublicPoolResolverAi: false,
  creator: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  startTime: 1770836400n,
  endTime: 1770922800n,
  no_of_options: 2n,
  inputAmountWei: 100000000n,
  barValues: [50, 50],
  baseToken: "0xCa4f77A38d8552Dd1D5E44e890173921B67725F4",
});
```

---

## buildClaimTx

Builds a **raw EVM transaction** to claim funds from a resolved Rain market.

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildClaimTx(params: ClaimTxParams): Promise<RawTransaction>
```

### Parameters

```ts
interface ClaimTxParams {
  marketId: string;
  walletAddress: `0x${string}`;
}
```

### Validations

| Parameter       | Type          | Required | Description                        |
| --------------- | ------------- | -------- | ---------------------------------- |
| `marketId`      | `string`      | ✅        | Unique identifier of the market    |
| `walletAddress` | `0x${string}` | ✅        | Address of the user claiming funds |

### Return Type

```ts
interface RawTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
}
```

### Example

```ts
const tx = await rain.buildClaimTx({
  marketId: "698c8f116e985bbfacc7fc01",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
});
```

---

## buildCloseMarketTx

Builds **raw EVM transactions** to close a Rain market and submit the resolution outcome.

Handles both V2 and V3 market contracts automatically. For V3 markets, checks token allowances and prepends an approval transaction if needed.

This function **does not send the transactions** — it only prepares calldata.

### Method Signature

```ts
buildCloseMarketTx(params: CloseMarketTxParams): Promise<RawTransaction[]>
```

### Parameters

```ts
interface CloseMarketTxParams {
  marketId: string;                    // MongoDB _id of the market
  walletAddress: `0x${string}`;       // Smart account address
  proposedOutcome?: number;            // Winner option index (required for V2 and V3 manual resolver)
  usdtTokenAddress?: `0x${string}`;  // Required for V3 USDT markets
  rainTokenAddress?: `0x${string}`;  // Required for V3 RAIN markets
  usdtSymbol?: string;                 // USDT symbol for the environment (e.g. "USDTm")
  tokenDecimals?: number;             // Defaults to 6
}
```

### Validations

| Field                | Type          | Required | Description                                              |
| -------------------- | ------------- | -------- | -------------------------------------------------------- |
| `marketId`           | `string`      | ✅        | MongoDB `_id` of the market                              |
| `walletAddress`      | `0x${string}` | ✅        | Smart account used for allowance checks                  |
| `proposedOutcome`    | `number`      | ⚠️        | Required for V2 markets and V3 manual resolver markets   |
| `usdtTokenAddress`   | `0x${string}` | ⚠️        | Required for V3 USDT markets                             |
| `rainTokenAddress`   | `0x${string}` | ⚠️        | Required for V3 RAIN markets                             |
| `usdtSymbol`         | `string`      | ❌        | Used to detect if market uses USDT as base token         |
| `tokenDecimals`      | `number`      | ❌        | Defaults to `6`                                          |

### Return Type

```ts
RawTransaction[] // [approve?, closePool] for V3 or [closePool, chooseWinner] for V2
```

### Example

```ts
// V2 market
const txs = await rain.buildCloseMarketTx({
  marketId: "698c8f116e985bbfacc7fc01",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  proposedOutcome: 0,
});

// V3 manual resolver with RAIN token
const txs = await rain.buildCloseMarketTx({
  marketId: "698c8f116e985bbfacc7fc01",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  proposedOutcome: 1,
  rainTokenAddress: "0xRainTokenAddress...",
  usdtSymbol: "USDTm",
});
```

---

## buildCreateDisputeTx

Builds **raw EVM transactions** to open a dispute on a Rain market.

Checks the user's token allowance against the dispute fee and prepends an approval transaction if needed.

This function **does not send the transactions** — it only prepares calldata.

### Method Signature

```ts
buildCreateDisputeTx(params: CreateDisputeTxParams): Promise<RawTransaction[]>
```

### Parameters

```ts
interface CreateDisputeTxParams {
  marketId: string;                   // MongoDB _id of the market
  walletAddress: `0x${string}`;      // User's wallet address
  usdtTokenAddress?: `0x${string}`; // Required for USDT markets
  rainTokenAddress?: `0x${string}`; // Required for RAIN markets
  usdtSymbol?: string;                // Used to detect market token type
}
```

### Validations

| Field               | Type          | Required | Description                                  |
| ------------------- | ------------- | -------- | -------------------------------------------- |
| `marketId`          | `string`      | ✅        | MongoDB `_id` of the market                  |
| `walletAddress`     | `0x${string}` | ✅        | Address of the user opening the dispute       |
| `usdtTokenAddress`  | `0x${string}` | ⚠️        | Required if market uses USDT as base token    |
| `rainTokenAddress`  | `0x${string}` | ⚠️        | Required if market uses RAIN as base token    |
| `usdtSymbol`        | `string`      | ❌        | Used to detect if market uses USDT            |

### Return Type

```ts
RawTransaction[] // [approve?, openDispute]
```

### Example

```ts
const txs = await rain.buildCreateDisputeTx({
  marketId: "698c8f116e985bbfacc7fc01",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  rainTokenAddress: "0xRainTokenAddress...",
  usdtSymbol: "USDTm",
});
```

---

## buildCreateAppealTx

Builds **raw EVM transactions** to appeal a dispute resolution on a Rain market.

Identical flow to `buildCreateDisputeTx` — checks token allowance against the appeal fee and prepends an approval if needed.

This function **does not send the transactions** — it only prepares calldata.

### Method Signature

```ts
buildCreateAppealTx(params: CreateAppealTxParams): Promise<RawTransaction[]>
```

### Parameters

```ts
interface CreateAppealTxParams {
  marketId: string;                   // MongoDB _id of the market
  walletAddress: `0x${string}`;      // User's wallet address
  usdtTokenAddress?: `0x${string}`; // Required for USDT markets
  rainTokenAddress?: `0x${string}`; // Required for RAIN markets
  usdtSymbol?: string;                // Used to detect market token type
}
```

### Validations

| Field               | Type          | Required | Description                                  |
| ------------------- | ------------- | -------- | -------------------------------------------- |
| `marketId`          | `string`      | ✅        | MongoDB `_id` of the market                  |
| `walletAddress`     | `0x${string}` | ✅        | Address of the user filing the appeal         |
| `usdtTokenAddress`  | `0x${string}` | ⚠️        | Required if market uses USDT as base token    |
| `rainTokenAddress`  | `0x${string}` | ⚠️        | Required if market uses RAIN as base token    |
| `usdtSymbol`        | `string`      | ❌        | Used to detect if market uses USDT            |

### Return Type

```ts
RawTransaction[] // [approve?, openDispute]
```

### Example

```ts
const txs = await rain.buildCreateAppealTx({
  marketId: "698c8f116e985bbfacc7fc01",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  rainTokenAddress: "0xRainTokenAddress...",
  usdtSymbol: "USDTm",
});
```

---

## buildExtendTimeTx

Builds a **raw EVM transaction** to re-submit an appeal by extending the oracle voting timer on a disputed Rain market.

Internally calls `resolver()` on the market contract to resolve the oracle address, then fetches a signed epoch from the Rain backend, and encodes the `extendTime(epoch, signature)` call targeting the oracle contract.

This function **does not send the transaction** — it only prepares calldata.

### Method Signature

```ts
buildExtendTimeTx(params: ExtendTimeTxParams): Promise<RawTransaction>
```

### Parameters

```ts
interface ExtendTimeTxParams {
  marketContractAddress: `0x${string}`; // TradeMarket contract address — resolver() is called on it
  walletAddress: `0x${string}`;         // Smart account address
  accessToken: string;                   // JWT from Rain auth (login)
}
```

### Validations

| Field                   | Type          | Required | Description                                          |
| ----------------------- | ------------- | -------- | ---------------------------------------------------- |
| `marketContractAddress` | `0x${string}` | ✅        | Market contract — used to look up the oracle address |
| `walletAddress`         | `0x${string}` | ✅        | Smart account address of the caller                  |
| `accessToken`           | `string`      | ✅        | JWT returned from `login()`                          |

### Return Type

```ts
interface RawTransaction {
  to: `0x${string}`; // oracle contract address (resolved on-chain)
  data: `0x${string}`;
}
```

### Example

```ts
const tx = await rain.buildExtendTimeTx({
  marketContractAddress: "0xMarketContractAddress...",
  walletAddress: "0x996ea23940f4a01610181D04bdB6F862719b63f0",
  accessToken: "eyJhbGciOi...",
});
```

---

## RainAA Class (Account Abstraction)

`RainAA` is responsible for:

* Smart account creation
* Session management (coming soon)
* Gas-sponsored execution (coming soon)
* Transaction submission (coming soon)

> `RainAA` consumes raw transactions generated by `Rain`.

### Conceptual Flow

```ts
Rain (WHAT to do)
   ↓
Raw Transaction
   ↓
RainAA (HOW to execute)
```

---

## Versioning Policy

Rain SDK follows **Semantic Versioning**:

* **Patch** (`1.0.x`) → Bug fixes
* **Minor** (`1.x.0`) → New features, backward compatible
* **Major** (`x.0.0`) → Breaking API changes

---

## Recommended Usage Pattern

```ts
// 1. Init SDK
const rain = new Rain({ environment: "production" });

// 2. Login
const { accessToken } = await rain.login({ signature, walletAddress, smartWalletAddress });

// 3. Read data / build tx
const rawTx = await rain.buildBuyOptionRawTx({ ... });

// 4. Execute via your provider
await yourProvider.sendTransaction(rawTx);
```

---

**Rain SDK** is built to scale with both products and protocols.
