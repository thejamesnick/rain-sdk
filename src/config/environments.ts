export const ALLOWED_ENVIRONMENTS = ["development", "stage", "production"] as const;
export const DEFAULT_RPCS: string[] = [
    "https://arbitrum.meowrpc.com",
    "https://rpc.sentio.xyz/arbitrum-one",
    "https://rpc.owlracle.info/arb/70d38ce1826c4a60bb2a8e05a6c8b20f"
]

export function getRandomRpc(): string {
    const index = Math.floor(Math.random() * DEFAULT_RPCS.length);
    return DEFAULT_RPCS[index];
}

export const USDT_SYMBOL_DEV = "USDTm";
export const USDT_SYMBOL_PROD = "USD₮0";

export const ENV_CONFIG = {
    development: {
        apiUrl: "https://dev-api.rain.one",
        market_factory_address: "0x148DA7F2039B2B00633AC2ab566f59C8a4C86313",
        dispute_initial_timer: 1 * 60,
        usdt_symbol: USDT_SYMBOL_DEV,
        usdt_token: "0xCa4f77A38d8552Dd1D5E44e890173921B67725F4" as `0x${string}`,
        rain_token: "0x25118290e6A5f4139381D072181157035864099d" as `0x${string}`,
    },

    stage: {
        apiUrl: "https://stg-api.rain.one",
        market_factory_address: "0x6109c9f28FE3Ad84c51368f7Ef2d487ca020c561",
        dispute_initial_timer: 1 * 60,
        usdt_symbol: USDT_SYMBOL_PROD,
        usdt_token: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as `0x${string}`,
        rain_token: "0x43976a124e6834b541840Ce741243dAD3dd538DA" as `0x${string}`,
    },

    production: {
        apiUrl: "https://prod-api.rain.one",
        market_factory_address: "0xccCB3C03D9355B01883779EF15C1Be09cf3623F1",
        dispute_initial_timer: 120 * 60,
        usdt_symbol: USDT_SYMBOL_PROD,
        usdt_token: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" as `0x${string}`,
        rain_token: "0x43976a124e6834b541840Ce741243dAD3dd538DA" as `0x${string}`,
    },
} as const;
