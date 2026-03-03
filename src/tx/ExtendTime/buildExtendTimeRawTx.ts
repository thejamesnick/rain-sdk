import { encodeFunctionData } from "viem";
import { Contract, JsonRpcProvider } from "ethers";
import { OracleAbi } from "../../abi/OracleAbi.js";
import { TradePoolAbi } from "../../abi/TradeMarketsAbi.js";
import { ExtendTimeTxParams, RawTransaction } from "../types.js";

async function getOracleAddress(
    marketContractAddress: string,
    rpcUrl: string
): Promise<`0x${string}`> {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(marketContractAddress, TradePoolAbi, provider);
    const resolver = await contract.resolver();
    return resolver as `0x${string}`;
}

async function fetchExtendTimeSignature(
    oracleContractAddress: string,
    walletAddress: string,
    accessToken: string,
    apiUrl: string
): Promise<{ epoch: bigint; signature: `0x${string}` }> {
    const res = await fetch(
        `${apiUrl}/pools/sign-oracles-extend-time?contractAddress=${oracleContractAddress}&walletAddress=${walletAddress}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error(`Failed to fetch extend time signature: ${res.status}`);
    const json = await res.json();
    const data = json?.data ?? json;
    if (!data?.epoch || !data?.signature) throw new Error("Invalid response from extend time signature endpoint");
    return {
        epoch: BigInt(data.epoch),
        signature: data.signature as `0x${string}`,
    };
}

export async function buildExtendTimeRawTx(
    params: ExtendTimeTxParams
): Promise<RawTransaction> {
    const { marketContractAddress, walletAddress, accessToken, apiUrl, rpcUrl } = params;

    if (!apiUrl) throw new Error("Environment is not set properly, api url is missing");
    if (!rpcUrl) throw new Error("rpcUrl is required");
    if (!marketContractAddress) throw new Error("marketContractAddress is required");
    if (!walletAddress) throw new Error("walletAddress is required");
    if (!accessToken) throw new Error("accessToken is required");

    const oracleContractAddress = await getOracleAddress(marketContractAddress, rpcUrl);

    const { epoch, signature } = await fetchExtendTimeSignature(
        oracleContractAddress,
        walletAddress,
        accessToken,
        apiUrl
    );

    return {
        to: oracleContractAddress,
        data: encodeFunctionData({
            abi: OracleAbi,
            functionName: "extendTime",
            args: [epoch, signature],
        }),
        value: 0n,
    };
}
