# Rain Builders — SDK Guide

Build complete prediction markets, trading applications, and custom integrations powered by Rain's automated protocol.

The Rain SDK provides the TypeScript tools you need to interact with our protocol on Arbitrum One. You can use it to build, sign, and send transactions for everything from creating new markets to trading options and claiming winnings.

Whether you're building a custom frontend, routing trades for your users, or launching specialized pools, the SDK handles the technical execution. By integrating Rain, you plug directly into our automated market maker (AMM) liquidity for logic-based forecasts.

If you're building high-speed applications, you can tap into our **RNG Layer**. This system uses verifiable randomness through Chainlink VRF to power mathematically-driven risk scenarios. Instead of using the individual pools required for standard prediction markets, the RNG Layer draws from a single shared liquidity pool. This gives your users instant settlement for fast-paced, random markets across any application built on this layer.

You can also give your users a simpler trading experience. The SDK includes an **account abstraction module**. This lets you manage smart accounts and sponsor gas fees, so your users can trade without worrying about network costs.

Our Builder Program supports platforms that drive volume or create unique markets. You bring the users and the ideas, and the SDK provides the on-chain infrastructure.

---

## What You Can Build

The SDK gives you direct access to the protocol's core functions. Here is what you can do right away.

- **Permissionless Market Creation** — Launch public or private markets on any verifiable event. You define the options, set the resolution rules, and provide the initial liquidity in a single transaction. Rain is open for anyone to build on, so you never need our approval to start a new pool.
- **Trading** — Construct interfaces for your users to buy and sell outcome shares against the AMM with market and limit orders.
- **Gas-Sponsored Execution** — Route transactions through the `RainAA` module. We use Alchemy smart accounts to cover gas costs. Your users can trade and interact with the protocol without needing to hold native ETH in their wallets.
- **Live Data Streams** — Connect to our WebSockets via `RainSocket` to receive real-time trade events, order activity, dispute updates, and market resolution notifications directly in your front end.

---

## SDK Architecture: The Two Pillars

The SDK is split into two independent classes. This structure separates the logical transaction building from the actual execution.

| Module | Role | Core Functions | Wallet Required |
| ------------------- | ---------------------- | ------------------------------------------------------------------- | --------------- |
| `Rain` (Stateless)  | Defines **what** to do | Market queries, transaction builders | No |
| `RainAA` (Stateful) | Defines **how** to execute | Smart account creation, gas-sponsored execution, session management | Yes |

### The Execution Flow

1. **Your Application** — The user interacts with your custom frontend.
2. **The `Rain` Class** — Your application calls a method here to build an action. All transaction builders return an unsigned `RawTransaction` containing the `to`, `data`, and optional `value` fields.
3. **The `RainAA` Class** — You pass that `RawTransaction` into this module. It manages the Alchemy smart accounts and signs the transaction via account abstraction, covering the network fees.
4. **Arbitrum One** — The transaction settles on-chain, interacting with our Diamond Proxy pools and the specific AMM for that option.

### The `Rain` Class (Stateless)

`Rain` operates without state. It fetches data and builds unsigned transactions. It does not require a connected wallet.

You use this class to query the protocol and construct actions. Because it returns a standard `RawTransaction`, you retain the freedom to decide how to execute it — whether you use `RainAA`, `wagmi`, `ethers`, or another custom provider.

### The `RainAA` Class (Stateful Execution)

`RainAA` maintains state. It handles the mechanics of account abstraction.

Once your stateless class generates the transaction data, you pass it here. This module takes care of the execution. It sponsors gas costs so your users do not need native ETH to trade.

---

## Quick Start

The Rain SDK is designed to get you reading data and building transactions as quickly as possible. Because the core `Rain` class is stateless, you can start fetching markets and building trade payloads without requiring users to connect a wallet upfront.

### Installation

First, install the SDK into your project using your preferred package manager.

```bash
npm install @rainprotocolsdk/sdk
npm install viem@^2.0.0  # Required peer dependency
```

### Your First Trade Flow

Here is a complete example of how you initialize the client, read active markets from the protocol, build a transaction to buy shares, and execute it.

**1. Initialize (stateless — no wallet needed)**

You set up the `Rain` class by pointing it to the development environment. This automatically configures the correct factory addresses and API endpoints.

```ts
const rain = new Rain({ environment: 'development' });
```

**2. Fetch Markets**

You query the protocol for a list of active markets. This pulls data directly from the Rain API.

```ts
const markets = await rain.getPublicMarkets({ limit: 10 });
```

**3. Build a Buy Transaction**

You define exactly what you want to do. In this case, you are building the raw transaction data to buy $10 worth of shares in Option 1.

```ts
const rawTx = rain.buildBuyOptionRawTx({
  marketContractAddress: '0x...',
  selectedOption: 1n,
  buyAmountInWei: 10_000_000n, // 10 USDT (Arbitrum USDT uses 6 decimals)
});
```

**4. Execute**

The SDK hands you back an unsigned `RawTransaction` (`{ to, data, value }`). You then pass this payload to your user's standard wallet provider, or route it through the `RainAA` class for gasless execution.

```ts
await yourProvider.sendTransaction(rawTx);
```

---

## Authentication

Before accessing protected endpoints, users must authenticate with the Rain API.

```ts
const result = await rain.login({
  walletAddress: '0x996ea23940f4a01610181D04bdB6F862719b63f0',
  signature: '0x...', // Signed message from user's wallet
});
// Returns: { accessToken, userId, ... }
```

The `accessToken` returned is required for methods that need user context, such as `getUserInvestments`, `buildClaimTx`, and `buildExtendTimeTx`.

---

## Creating a Market

Launch your own prediction markets on any verifiable event.

One of the core features of building on Rain is permissionless market creation. You do not need approval to start a new pool. If an event has a verifiable outcome, you can build a market around it using the SDK.

When you create a market, you define the question, set the possible options, and provide the initial liquidity. This liquidity allows the Automated Market Maker (AMM) to start pricing shares immediately.

### Public vs. Private Markets

Before writing the code, you need to decide what kind of market you are building using the `isPublic` parameter.

- **Public Markets** — These are open to anyone and are great for topics like sports, politics, or global events. The market can be resolved either by a specialized AI oracle or by the market creator.
- **Private Markets** — These are designed for specific groups or topics and require a secret access code to join. The person who creates the pool acts as the resolver and decides the outcome.

### Building the Transaction

You use the stateless `Rain` class to construct the transaction. The `buildCreateMarketTx` method requires specific parameters to set the probabilities, dates, and token decimals.

Because creating a market usually requires approving the token spend first, this method returns an array of raw transactions that you must execute in order.

```ts
import { Rain } from '@rainprotocolsdk/sdk';

const rain = new Rain({ environment: 'production' });

// buildCreateMarketTx returns an array: [approveTx, createTx] or just [createTx]
const txs = await rain.buildCreateMarketTx({
  marketQuestion: 'Will BTC hit 100k?',
  marketOptions: ['Yes', 'No', 'Maybe'],
  marketTags: ['crypto', 'bitcoin'],
  marketDescription: 'Prediction market for BTC price',
  isPublic: true,
  isPublicPoolResolverAi: false,
  creator: '0x996ea23940f4a01610181D04bdB6F862719b63f0',
  startTime: 1770836400n,
  endTime: 1770922800n,
  no_of_options: 3n,
  inputAmountWei: 100_000_000n,  // 100 USDT (min 10 tokens)
  barValues: [34, 33, 33],       // Initial probability distribution (%)
  baseToken: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  tokenDecimals: 6,
});

// Execute sequentially
for (const tx of txs) {
  await yourProvider.sendTransaction(tx);
}
```

### Breaking Down the Parameters

- **Text Fields** — `marketQuestion`, `marketDescription`, and `marketTags` define how the market appears to users.
- **Options** — `marketOptions` is an array of the possible outcomes. `no_of_options` is the numerical count of those choices.
- **Permissions** — `isPublic` determines if the market is open or access-restricted. `isPublicPoolResolverAi` dictates if the AI oracle handles the resolution.
- **Timing** — `startTime` and `endTime` are Unix timestamps defining when the market is active.
- **Liquidity & Tokens** — `inputAmountWei` is your initial funding. The minimum requirement is $10 in the chosen token. `baseToken` is the contract address of the currency being used, and `tokenDecimals` ensures the math is calculated correctly.
- **Initial Odds** — `barValues` sets the starting probability distribution for the options as a percentage. All values must sum to 100.

### Managing the Market Lifecycle

Creating the market is just the first step. To manage the conclusion of a market, the SDK provides these transaction builders:

- `buildCloseMarketTx(params)` — Builds a raw transaction to officially close the market and halt trading.
- `buildCreateDisputeTx(params)` — Builds a raw transaction to open a dispute on the market outcome.
- `buildCreateAppealTx(params)` — Builds a raw transaction to appeal a dispute decision.
- `buildExtendTimeTx(params)` — Builds a raw transaction to extend the dispute resolution window (re-submit appeal).

---

## Trading & Positions

Build interfaces for buying shares, placing limit orders, and claiming winnings.

Once a market is live, participants can start taking positions. The Rain SDK allows you to construct trading actions directly from the protocol.

Because trades happen against our Automated Market Maker (AMM), your users get instant execution. They do not have to wait for a counterparty to match their order.

### Buying Options

When a user buys an option, they are purchasing shares of a specific outcome. The price of these shares is determined by the AMM based on the current pool ratios.

Here is how you build a standard market order to buy shares.

```ts
import { Rain } from '@rainprotocolsdk/sdk';

const rain = new Rain({ environment: 'production' });

// Build the raw buy transaction
const buyTx = rain.buildBuyOptionRawTx({
  marketContractAddress: '0x...',
  selectedOption: 1n,          // The option index (e.g., 0 for Yes, 1 for No)
  buyAmountInWei: 10_000_000n, // 10 USDT (Arbitrum USDT uses 6 decimals)
});
```

If a user wants to set a specific entry target rather than taking the current AMM price, you can build a limit order instead.

```ts
// Build a limit buy transaction
const limitTx = rain.buildLimitBuyOptionTx({
  marketContractAddress: '0x...',
  selectedOption: 1,
  pricePerShare: 500000000000000000n, // 0.50 represented in 1e18
  buyAmountInWei: 10_000_000n,
  tokenDecimals: 6,
});
```

### Selling Options

Users do not have to hold their shares until the market resolves. If the odds shift in their favor, they can sell their position early to lock in a profit.

```ts
// Build a limit sell transaction
const sellTx = rain.buildLimitSellOptionTx({
  marketContractAddress: '0x...',
  selectedOption: 1,
  pricePerShare: 500000000000000000n, // 0.50 represented in 1e18
  shares: 5_000_000n,                 // The number of shares to sell
  tokenDecimals: 6,
});
```

### Canceling Orders

If a user places limit orders that have not been filled yet, they might want to cancel them. You can build a transaction to remove specific open orders by referencing their order IDs, or cancel all open orders at once.

```ts
// Build a transaction to cancel specific open orders
const cancelTx = rain.buildCancelOrdersTx({
  marketContractAddress: '0x...',
  orders: [
    { option: 1, price: 0.5, orderID: 1n },
    { option: 1, price: 0.6, orderID: 2n },
  ],
});

// Build a transaction to cancel all open orders for a user
const cancelAllTx = await rain.buildCancelAllOpenOrdersTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});
```

### Claiming Winnings

When a market concludes, it goes through a resolution phase and a short dispute window. Once that window closes, the market is officially settled.

Users who hold shares in the winning outcome can then claim their payout. The payout is drawn from the total pool of funds, after a platform fee is collected.

```ts
// Build the raw claim transaction
const claimTx = await rain.buildClaimTx({
  marketId: '698c8f116e985bbfacc7fc01',
  walletAddress: '0x996ea23940f4a01610181D04bdB6F862719b63f0',
});
```

This single transaction sends the user's original stake plus their winnings directly to their wallet or smart account.

---

## Liquidity

Every market on Rain needs liquidity to function. Because trades execute against an Automated Market Maker (AMM), the pool requires an initial supply of funds to price shares and settle outcomes.

### Adding Liquidity

Use `buildAddLiquidityTx` to let users supply funds to an existing market. The SDK reads the market's base token on-chain and only requests the approval needed — either USDT or RAIN, depending on the market.

```ts
const txs = await rain.buildAddLiquidityTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  amount: 100,  // human-readable amount — decimals auto-detected (6 for USDT, 18 for RAIN)
});

// Execute sequentially
for (const tx of txs) {
  await yourProvider.sendTransaction(tx);
}
```

Returns `[approveTx, enterLiquidityTx]` if the allowance is insufficient, or `[enterLiquidityTx]` if already approved.

### How LPs Earn Fees

Liquidity providers take on the other side of the trades. They fund the entire market rather than betting on "Yes" or "No". In return for taking on this risk, they earn a cut of the trading activity.

The protocol charges a 5% fee on transactions. From that total volume, 1.2% is automatically distributed back to the liquidity providers of that specific market.

For applications built on the RNG Layer, like Risk Markets, liquidity providers act as the "house". They still earn the 1.2% volume fee. Additionally, if players fail to exit their positions before a scenario terminates, their stakes remain in the pool, which increases the value of the LP shares.

### Withdrawing Liquidity

Liquidity is locked until the market reaches its resolution. There is no method to remove liquidity while the market is active.

Liquidity providers recover their initial supplied share, plus any accumulated fees, by using the standard `buildClaimTx` method after the market officially resolves and settles.

---

## Disputes & Appeals

When a market resolves, participants can challenge the outcome through the dispute and appeal system.

### Opening a Dispute

If a participant believes the market outcome is incorrect, they can open a dispute.

```ts
const disputeTxs = await rain.buildCreateDisputeTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});

for (const tx of disputeTxs) {
  await yourProvider.sendTransaction(tx);
}
```

### Filing an Appeal

If the dispute resolution is also contested, participants can escalate it through an appeal.

```ts
const appealTxs = await rain.buildCreateAppealTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});

for (const tx of appealTxs) {
  await yourProvider.sendTransaction(tx);
}
```

### Extending the Dispute Window

If more time is needed for resolution, the dispute window can be extended.

```ts
const extendTx = await rain.buildExtendTimeTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});

await yourProvider.sendTransaction(extendTx);
```

---

## Account Abstraction

Remove gas fees from your trading experience using stateful execution.

The SDK splits its functionality into two classes. While the `Rain` class is stateless and handles your queries and transaction building, it does not send transactions.

To execute trades without requiring users to hold native ETH for gas, you use the `RainAA` class. This stateful class manages Alchemy smart accounts with gas sponsorship.

### Setting Up the Execution Engine

To get started, you initialize the `RainAA` class with your standard viem wallet client and your Alchemy credentials.

```ts
import { RainAA } from '@rainprotocolsdk/sdk';
import { arbitrum } from 'viem/chains';

const rainAA = new RainAA({
  walletClient: yourWalletClient,      // viem WalletClient
  alchemyApiKey: 'your-alchemy-key',
  paymasterPolicyId: 'your-policy-id',
  chain: arbitrum,
  rpcUrl: 'https://...',               // Optional
});
```

Once initialized, you connect the client. This derives a smart account from the user's Externally Owned Account (EOA).

```ts
// Connect, derives smart account from EOA
const smartAccountAddress = await rainAA.connect();
console.log('Smart account:', smartAccountAddress);
```

### Session Management

The `RainAA` class provides simple accessors to retrieve the connected smart account address and the underlying AA client. When the session is over, you can disconnect the user.

```ts
rainAA.address;   // Smart account address (throws if not connected)
rainAA.client;    // Underlying AA client (throws if not connected)

// Disconnect
rainAA.disconnect();
```

---

## WebSockets & Live Data

Keep your application in sync with the protocol without constantly polling for updates.

The `RainSocket` class provides a dedicated WebSocket client that connects to the Rain API and exposes typed event subscriptions. Each subscription method returns an unsubscribe function — call it when the user navigates away to prevent memory leaks.

### Setting Up

```ts
import { RainSocket } from '@rainprotocolsdk/sdk';

const rs = new RainSocket({ environment: 'production' });

rs.onConnect(() => console.log('Connected'));
rs.onDisconnect(() => console.log('Disconnected'));
```

### Trade Events

```ts
// Fires when a user buys into a market option
const unsub = rs.onEnterOption(marketId, (data) => {
  console.log(data.poolId, data.investments, data.totalInvestmentWei);
});

// Fires when a new limit order is placed
const unsub = rs.onOrderCreated(marketId, (data) => {
  console.log(data.poolId, data.order);
});

// Fires when an open order is cancelled
const unsub = rs.onOrderCancelled(marketId, (data) => {
  console.log(data.poolId, data.order);
});

// Fires when a limit order is partially or fully filled
const unsub = rs.onOrderFilled(marketId, (data) => {
  console.log(data.poolId, data.raw);
});
```

### Dispute & Appeal Events

```ts
// Fires when a dispute is opened on a market
const unsub = rs.onDisputeOpened(marketId, (data) => {
  console.log(data.poolId, data.isDisputed, data.status);
});

// Fires when an appeal is filed
const unsub = rs.onAppealOpened(marketId, (data) => {
  console.log(data.poolId, data.isAppealed);
});

// Fires when the dispute window is extended
const unsub = rs.onDisputeTimeExtended(marketId, (data) => {
  console.log(data.poolId, data.newEndTime);
});
```

### Resolution Events

```ts
// Fires when a dispute winner is decided
const unsub = rs.onDisputeWinner(marketId, (data) => {
  console.log(data.poolId, data.winnerOption);
});

// Fires when an appeal winner is finalized
const unsub = rs.onAppealWinner(marketId, (data) => {
  console.log(data.poolId, data.winnerFinalized);
});

// Fires when a user's reward claim is confirmed
// Note: requires both marketId and userId
const unsub = rs.onClaimReward(marketId, userId, (data) => {
  console.log(data.poolId, data.userId);
});
```

### Cleanup

```ts
// Stop a specific subscription
unsub();

// Disconnect the socket entirely
rs.disconnect();
```

---

## Environments & Configuration

Set up your application for development, testing, or production.

When initializing the Rain class, your configuration dictates which endpoints and contract addresses the SDK interacts with.

### Environment Addresses

The SDK automatically selects the correct Factory Address and API endpoint based on your chosen environment.

| Environment | API Endpoint | Factory Address |
| ----------- | ------------ | --------------- |
| development | dev-api.rain.one | 0x148DA7F2039B2B00633AC2ab566f59C8a4C86313 |
| stage | stg-api.rain.one | 0x6109c9f28FE3Ad84c51368f7Ef2d487ca020c561 |
| production | prod-api.rain.one | 0xccCB3C03D9355B01883779EF15C1Be09cf3623F1 |

You will also frequently interact with the standard base token, which is Arbitrum USDT (`0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`) using 6 decimals.

### Full Configuration Options

```ts
const rain = new Rain({
  environment: 'development',  // 'development' | 'stage' | 'production'
  rpcUrl: 'https://...',       // Optional, defaults to public Arbitrum RPCs
});
```

---

## API Reference

A comprehensive list of methods, parameters, and return types for the Rain SDK.

All transaction builders return an unsigned `RawTransaction` (`{ to, data, value? }`) that must be executed by a wallet or smart account.

---

### Authentication

#### `login(params)`

Authenticate a user with the Rain API.

```ts
const result = await rain.login({
  walletAddress: '0x...',
  signature: '0x...',
});
// Returns: LoginResult
// { accessToken, userId, ... }
```

---

### Market Queries

#### `getPublicMarkets(params)`

Browse markets based on specific filters.

```ts
const markets = await rain.getPublicMarkets({
  limit: 12,
  offset: 0,
  sortBy: 'Liquidity',   // 'Liquidity' | 'Volumn' | 'latest'
  status: 'Live',        // 'Live' | 'Trading' | 'Closed' | ...
  creator: '0x...',      // Optional — filter by creator
});
// Returns: Market[]
// { id, title, totalVolume, status, contractAddress, poolOwnerWalletAddress }
```

#### `getMarketById(params)`

Fetch a single market by its API ID.

```ts
const market = await rain.getMarketById({
  marketId: '698c8f116e985bbfacc7fc01',
  accessToken: 'your-access-token',  // Optional
});
// Returns: Market
```

#### `getUserInvestments(params)`

Fetch all active investments for a specific user.

```ts
const investments = await rain.getUserInvestments({
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});
// Returns: UserInvestment[]
```

---

### Transaction Builders

#### Approvals

```ts
// buildApprovalTx(params) — ERC20 approve
const tx = rain.buildApprovalTx({
  tokenAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',  // USDT
  spender: '0x...',     // market contract address
  amount: 100_000_000n, // Optional — defaults to max uint256
});
```

#### Creating a Market

Returns `[approveTx, createTx]` if approval is needed, or `[createTx]` if already approved.

```ts
const txs = await rain.buildCreateMarketTx({
  marketQuestion: 'Will BTC hit 100k?',
  marketOptions: ['Yes', 'No', 'Maybe'],
  marketTags: ['crypto', 'bitcoin'],
  marketDescription: 'Prediction market for BTC price',
  isPublic: true,
  isPublicPoolResolverAi: false,
  creator: '0x996ea23940f4a01610181D04bdB6F862719b63f0',
  startTime: 1770836400n,
  endTime: 1770922800n,
  no_of_options: 3n,
  inputAmountWei: 100_000_000n,
  barValues: [34, 33, 33],
  baseToken: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  tokenDecimals: 6,
});
```

#### Trading Options

```ts
// buildBuyOptionRawTx(params) — Market buy
const tx = rain.buildBuyOptionRawTx({
  marketContractAddress: '0x...',
  selectedOption: 1n,           // Option index (bigint)
  buyAmountInWei: 10_000_000n, // 10 USDT
});

// buildLimitBuyOptionTx(params) — Limit buy order
const limitBuyTx = rain.buildLimitBuyOptionTx({
  marketContractAddress: '0x...',
  selectedOption: 1,
  pricePerShare: 500000000000000000n,  // 0.50 in 1e18
  buyAmountInWei: 10_000_000n,
  tokenDecimals: 6,
});

// buildLimitSellOptionTx(params) — Limit sell order
const limitSellTx = rain.buildLimitSellOptionTx({
  marketContractAddress: '0x...',
  selectedOption: 1,
  pricePerShare: 500000000000000000n,  // 0.50 in 1e18
  shares: 5_000_000n,
  tokenDecimals: 6,
});

// buildCancelOrdersTx(params) — Cancel specific open orders
const cancelTx = rain.buildCancelOrdersTx({
  marketContractAddress: '0x...',
  orders: [
    { option: 1, price: 0.5, orderID: 1n },
    { option: 1, price: 0.6, orderID: 2n },
  ],
});

// buildCancelAllOpenOrdersTx(params) — Cancel all open orders for a user
const cancelAllTx = await rain.buildCancelAllOpenOrdersTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});
```

#### Market Lifecycle

```ts
// buildCloseMarketTx(params) — Close market and halt trading
const closeTx = await rain.buildCloseMarketTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});

// buildAddLiquidityTx(params) — Add liquidity to a market
const addLiqTxs = await rain.buildAddLiquidityTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  amount: 100,  // human-readable — reads baseToken() on-chain, uses 6 decimals for USDT or 18 for RAIN
});
// Returns [approveTx, enterLiquidityTx] or [enterLiquidityTx] if already approved.

// buildClaimTx(params) — Claim winnings after market settles
const claimTx = await rain.buildClaimTx({
  marketId: '698c8f116e985bbfacc7fc01',
  walletAddress: '0x996ea23940f4a01610181D04bdB6F862719b63f0',
});
```

#### Disputes & Appeals

```ts
// buildCreateDisputeTx(params) — Open a dispute on market outcome
const disputeTxs = await rain.buildCreateDisputeTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});

// buildCreateAppealTx(params) — Appeal a dispute decision
const appealTxs = await rain.buildCreateAppealTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});

// buildExtendTimeTx(params) — Extend the dispute resolution window
const extendTx = await rain.buildExtendTimeTx({
  marketContractAddress: '0x...',
  walletAddress: '0x...',
  accessToken: 'your-access-token',
});
```

---

### RainSocket — WebSocket Subscriptions

All subscription methods return an unsubscribe function `() => void`.

```ts
import { RainSocket } from '@rainprotocolsdk/sdk';

const rs = new RainSocket({ environment: 'production' });

// Connection lifecycle
rs.onConnect(callback)
rs.onDisconnect(callback)

// Trade events
rs.onEnterOption(marketId, callback)       // enter-option/{marketId}
rs.onOrderCreated(marketId, callback)      // order-created/{marketId}
rs.onOrderCancelled(marketId, callback)    // order-cancelled/{marketId}
rs.onOrderFilled(marketId, callback)       // order-filled/{marketId}

// Dispute & appeal events
rs.onDisputeOpened(marketId, callback)         // dispute-opened/{marketId}
rs.onAppealOpened(marketId, callback)          // appeal-opened/{marketId}
rs.onDisputeTimeExtended(marketId, callback)   // dispute-time-extented/{marketId}

// Resolution events
rs.onDisputeWinner(marketId, callback)                 // dispute-winner/{marketId}
rs.onAppealWinner(marketId, callback)                  // appeal-winner/{marketId}
rs.onClaimReward(marketId, userId, callback)           // claim-reward/{marketId}/{userId}

// Disconnect
rs.disconnect()
```

---

### RainAA — Account Abstraction

`RainAA` manages Alchemy smart accounts with gas sponsorship.

```ts
import { RainAA } from '@rainprotocolsdk/sdk';
import { arbitrum } from 'viem/chains';

const rainAA = new RainAA({
  walletClient: yourWalletClient,       // viem WalletClient
  alchemyApiKey: 'your-alchemy-key',
  paymasterPolicyId: 'your-policy-id',
  chain: arbitrum,
  rpcUrl: 'https://...',               // Optional
});

// Connect — derives smart account from EOA
const smartAccountAddress = await rainAA.connect();

// Accessors
rainAA.address;   // Smart account address (throws if not connected)
rainAA.client;    // Underlying AA client (throws if not connected)

// Disconnect
rainAA.disconnect();
```

---

### Key Types

```ts
// Core transaction type — returned by all builders
interface RawTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

// Market from listing endpoint
interface Market {
  id: string;
  title: string;
  totalVolume: string;
  status: MarketStatus;
  contractAddress?: string;
  poolOwnerWalletAddress?: string;
}

type MarketStatus = 'Live' | 'New' | 'WaitingForResult' | 'UnderDispute' |
  'UnderAppeal' | 'ClosingSoon' | 'InReview' | 'InEvaluation' | 'Closed' | 'Trading';
```

---

## Full Method Reference

A complete directory of all available methods in the Rain SDK.

### Rain Class

| Method | Returns | Async |
| ------ | ------- | ----- |
| **Authentication** | | |
| `login(params)` | `LoginResult` | Yes |
| **Market Queries** | | |
| `getPublicMarkets(params)` | `Market[]` | Yes |
| `getMarketById(params)` | `Market` | Yes |
| `getUserInvestments(params)` | `UserInvestment[]` | Yes |
| **Transaction Builders** | | |
| `buildApprovalTx(params)` | `RawTransaction` | No |
| `buildCreateMarketTx(params)` | `RawTransaction[]` | Yes |
| `buildBuyOptionRawTx(params)` | `RawTransaction` | No |
| `buildLimitBuyOptionTx(params)` | `RawTransaction` | No |
| `buildLimitSellOptionTx(params)` | `RawTransaction` | No |
| `buildCancelOrdersTx(params)` | `RawTransaction[]` | No |
| `buildCancelAllOpenOrdersTx(params)` | `RawTransaction[]` | Yes |
| `buildAddLiquidityTx(params)` | `RawTransaction[]` | Yes |
| `buildClaimTx(params)` | `RawTransaction` | Yes |
| `buildCloseMarketTx(params)` | `RawTransaction[]` | Yes |
| `buildCreateDisputeTx(params)` | `RawTransaction[]` | Yes |
| `buildCreateAppealTx(params)` | `RawTransaction[]` | Yes |
| `buildExtendTimeTx(params)` | `RawTransaction` | Yes |

### RainAA Class

| Method | Returns | Async |
| ------ | ------- | ----- |
| `connect()` | `` 0x${string} `` | Yes |
| `disconnect()` | `void` | No |
| `.address` | `` 0x${string} `` | — |
| `.client` | Smart wallet client | — |

### RainSocket Class

| Method | Returns | Async |
| ------ | ------- | ----- |
| `onConnect(callback)` | `void` | No |
| `onDisconnect(callback)` | `void` | No |
| `onEnterOption(marketId, callback)` | `Unsubscribe` | No |
| `onOrderCreated(marketId, callback)` | `Unsubscribe` | No |
| `onOrderCancelled(marketId, callback)` | `Unsubscribe` | No |
| `onOrderFilled(marketId, callback)` | `Unsubscribe` | No |
| `onDisputeOpened(marketId, callback)` | `Unsubscribe` | No |
| `onAppealOpened(marketId, callback)` | `Unsubscribe` | No |
| `onDisputeTimeExtended(marketId, callback)` | `Unsubscribe` | No |
| `onDisputeWinner(marketId, callback)` | `Unsubscribe` | No |
| `onAppealWinner(marketId, callback)` | `Unsubscribe` | No |
| `onClaimReward(marketId, userId, callback)` | `Unsubscribe` | No |
| `disconnect()` | `void` | No |

---

## Local Development

Instructions for building and testing the Rain SDK locally.

If you are looking to contribute to the SDK or run the test suite, follow these steps to set up your local development environment.

### Installation

First, navigate to the rain-sdk directory and install the necessary dependencies:

```bash
cd rain-sdk
npm install
```

### Available Scripts

The following commands are available for development and testing.

#### Build the SDK

Compiles the TypeScript source code into the final distribution files.

```bash
npm run build
```

#### Development Mode

Runs the development environment in watch mode, automatically recompiling when files are changed.

```bash
npm run dev
```

#### Run Tests

Executes the standard test suite to ensure everything is functioning correctly.

```bash
npm test
```

#### Integration Tests

Runs tests that interact with external services or the blockchain to verify end-to-end functionality.

```bash
npm run test:integration
```
