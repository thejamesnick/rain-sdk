import { Contract, JsonRpcProvider } from "ethers";
import { TradePoolAbi } from "../../abi/TradeMarketsAbi.js";
import { ERC20Abi } from "../../abi/ERC20Abi.js";
import { GET_RESOLVER_BOND_AMOUNT } from "../../constants/contractmethods.js";

export async function getResolverBondAmount(
    contractAddress: `0x${string}`,
    rpcUrl: string
): Promise<bigint> {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, TradePoolAbi, provider);
    const bondAmount = await contract[GET_RESOLVER_BOND_AMOUNT]();
    return BigInt(bondAmount);
}

export async function getTokenAllowance(
    tokenAddress: `0x${string}`,
    owner: `0x${string}`,
    spender: `0x${string}`,
    rpcUrl: string
): Promise<bigint> {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(tokenAddress, ERC20Abi, provider);
    const allowance = await contract.allowance(owner, spender);
    return BigInt(allowance);
}
