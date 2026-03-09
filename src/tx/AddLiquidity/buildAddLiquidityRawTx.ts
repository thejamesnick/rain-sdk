import { encodeFunctionData } from "viem";
import { Contract, JsonRpcProvider, ethers } from "ethers";
import { TradePoolAbi } from "../../abi/TradeMarketsAbi.js";
import { AddLiquidityTxParams, RawTransaction } from "../types.js";
import { buildApproveRawTx } from "../buildApprovalRawTx.js";
import { getTokenAllowance } from "../CloseMarket/helpers.js";
import { isRpcValid } from "../ClaimFunds/helpers.js";
import { ENV_CONFIG, ALLOWED_ENVIRONMENTS } from "../../config/environments.js";
import { RainEnvironment } from "../../types.js";

interface AddLiquidityRawTxInternalParams extends AddLiquidityTxParams {
    environment: RainEnvironment;
    rpcUrl: string;
}

async function getMarketBaseToken(marketContractAddress: string, rpcUrl: string): Promise<string> {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(marketContractAddress, TradePoolAbi, provider);
    return (await contract.baseToken()).toLowerCase();
}

export async function buildAddLiquidityRawTx(
    params: AddLiquidityRawTxInternalParams
): Promise<RawTransaction[]> {
    const { marketContractAddress, walletAddress, amount, environment, rpcUrl } = params;

    if (!marketContractAddress) throw new Error("marketContractAddress is required");
    if (!walletAddress) throw new Error("walletAddress is required");
    if (!amount) throw new Error("amount is required");
    if (!ALLOWED_ENVIRONMENTS.includes(environment)) throw new Error(`Invalid environment: ${environment}`);

    const isRpcWorking = await isRpcValid(rpcUrl);
    if (!isRpcWorking) throw new Error("Provided RPC URL is not valid or not working");

    const { usdt_token, rain_token } = ENV_CONFIG[environment];

    // Read base token from the market contract
    const baseToken = await getMarketBaseToken(marketContractAddress, rpcUrl);

    const isUsdtMarket = baseToken === usdt_token.toLowerCase();
    const tokenAddress = isUsdtMarket ? usdt_token : rain_token;

    // USDT uses 6 decimals, RAIN uses 18
    const decimals = isUsdtMarket ? 6 : 18;
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);

    const txs: RawTransaction[] = [];

    // Check allowance for the correct token only
    const allowance = await getTokenAllowance(tokenAddress, walletAddress, marketContractAddress, rpcUrl);
    if (BigInt(allowance) < amountInWei) {
        txs.push(buildApproveRawTx({ tokenAddress, spender: marketContractAddress }));
    }

    // enterLiquidity tx on the market contract
    txs.push({
        to: marketContractAddress,
        data: encodeFunctionData({
            abi: TradePoolAbi,
            functionName: "enterLiquidity",
            args: [amountInWei],
        }),
        value: 0n,
    });

    return txs;
}
