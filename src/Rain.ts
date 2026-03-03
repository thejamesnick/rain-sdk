import { GetMarketByIdParams, GetMarketsParams, GetUserInvestmentsParams, Market, UserInvestment } from './markets/types.js';
import { getMarkets } from './markets/getMarkets.js';
import { getMarketById } from './markets/getMarketById.js';
import { getUserInvestments } from './markets/getUserInvestments.js';
import { ApproveTxParams, CancelAllOpenOrdersTxParams, CancelOrdersTxParams, ClaimTxParams, CloseMarketTxParams, CreateDisputeTxParams, CreateAppealTxParams, CreateMarketTxParams, EnterLimitOptionTxParams, EnterOptionTxParams, ExtendTimeTxParams, LimitSellOptionTxParams, RawTransaction } from './tx/types.js';
import { buildEnterOptionRawTx, buildLimitBuyOrderRawTx, buildLimitSellOrderRawTx } from './tx/buildRawTransactions.js';
import { buildCancelOrdersRawTx } from './tx/buildCancelOrdersRawTx.js';
import { buildCancelAllOpenOrdersRawTx } from './tx/buildCancelAllOpenOrdersRawTx.js';
import { buildCloseMarketRawTx } from './tx/CloseMarket/buildCloseMarketRawTx.js';
import { buildCreateDisputeRawTx, buildCreateAppealRawTx } from './tx/Dispute/buildDisputeRawTx.js';
import { buildApproveRawTx } from './tx/buildApprovalRawTx.js';
import { buildCreateMarketRawTx } from './tx/CreateMarket/buildCreateMarketRawTx.js';
import { RainCoreConfig, RainEnvironment } from './types.js';
import { ALLOWED_ENVIRONMENTS, ENV_CONFIG, getRandomRpc } from './config/environments.js';
import { buildClaimRawTx } from './tx/ClaimFunds/buildClaimFundsRawTx.js';
import { buildExtendTimeRawTx } from './tx/ExtendTime/buildExtendTimeRawTx.js';
import { loginUser } from './auth/login.js';
import { LoginParams, LoginResult } from './auth/types.js';

export class Rain {

  public readonly environment: RainEnvironment;
  private readonly marketFactory: `0x${string}`;
  private readonly apiUrl: string;
  private readonly distute_initial_timer: number;
  private readonly rpcUrl?: string;
  private readonly usdtSymbol: string;

  constructor(config: RainCoreConfig = {}) {
    const { environment = "development", rpcUrl } = config;

    function isValidEnvironment(env: string): env is RainEnvironment {
      return ALLOWED_ENVIRONMENTS.includes(env as RainEnvironment);
    }

    if (!isValidEnvironment(environment)) {
      throw new Error(
        `Invalid environment "${environment}". Allowed values: ${ALLOWED_ENVIRONMENTS.join(", ")}`
      );
    }
    this.environment = environment;
    this.rpcUrl = rpcUrl ?? getRandomRpc();
    const envConfig = ENV_CONFIG[this.environment];
    this.marketFactory = envConfig.market_factory_address
    this.apiUrl = envConfig.apiUrl;
    this.distute_initial_timer = envConfig.dispute_initial_timer;
    this.usdtSymbol = envConfig.usdt_symbol;
  }

  async getPublicMarkets(params: GetMarketsParams): Promise<Market[]> {
    return getMarkets({ ...params, apiUrl: this.apiUrl });
  }

  async getMarketById(params: GetMarketByIdParams): Promise<Market> {
    return getMarketById({ ...params, apiUrl: this.apiUrl });
  }

  async getUserInvestments(params: GetUserInvestmentsParams): Promise<UserInvestment[]> {
    return getUserInvestments({ ...params, apiUrl: this.apiUrl });
  }

  buildApprovalTx(params: ApproveTxParams): RawTransaction | Error {
    return buildApproveRawTx(params);
  }

  buildBuyOptionRawTx(params: EnterOptionTxParams): RawTransaction {
    return buildEnterOptionRawTx(params);
  }

  buildLimitBuyOptionTx(
    params: EnterLimitOptionTxParams
  ): RawTransaction {
    return buildLimitBuyOrderRawTx(params);
  }

  buildLimitSellOptionTx(
    params: LimitSellOptionTxParams
  ): RawTransaction {
    return buildLimitSellOrderRawTx(params);
  }

  buildCancelOrdersTx(params: CancelOrdersTxParams): RawTransaction[] {
    return buildCancelOrdersRawTx(params);
  }

  async buildCancelAllOpenOrdersTx(params: CancelAllOpenOrdersTxParams): Promise<RawTransaction[]> {
    return buildCancelAllOpenOrdersRawTx({ ...params, apiUrl: this.apiUrl });
  }

  buildCreateMarketTx(params: CreateMarketTxParams): Promise<RawTransaction[]> {
    return buildCreateMarketRawTx({ ...params, factoryContractAddress: this.marketFactory, apiUrl: this.apiUrl, rpcUrl: this.rpcUrl, disputeTimer: this.distute_initial_timer });
  }

  async buildClaimTx(params: ClaimTxParams): Promise<RawTransaction> {
    return buildClaimRawTx({ ...params, apiUrl: this.apiUrl, rpcUrl: this.rpcUrl });
  }

  async buildCloseMarketTx(params: CloseMarketTxParams): Promise<RawTransaction[]> {
    return buildCloseMarketRawTx({ ...params, apiUrl: this.apiUrl, rpcUrl: this.rpcUrl, usdtSymbol: this.usdtSymbol });
  }

  async buildCreateDisputeTx(params: CreateDisputeTxParams): Promise<RawTransaction[]> {
    return buildCreateDisputeRawTx({ ...params, apiUrl: this.apiUrl, rpcUrl: this.rpcUrl, usdtSymbol: this.usdtSymbol });
  }

  async buildCreateAppealTx(params: CreateAppealTxParams): Promise<RawTransaction[]> {
    return buildCreateAppealRawTx({ ...params, apiUrl: this.apiUrl, rpcUrl: this.rpcUrl, usdtSymbol: this.usdtSymbol });
  }

  async buildExtendTimeTx(params: ExtendTimeTxParams): Promise<RawTransaction> {
    return buildExtendTimeRawTx({ ...params, apiUrl: this.apiUrl, rpcUrl: this.rpcUrl });
  }

  async login(params: LoginParams): Promise<LoginResult> {
    return loginUser({ ...params, apiUrl: this.apiUrl });
  }

}
