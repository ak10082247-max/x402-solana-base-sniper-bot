#!/usr/bin/env node
export declare const SERVICE_VERSION = "1.1.0";
export declare const X402_UPGRADE_HINT = "Evaluated via free preview. Set SOLANA_PRIVATE_KEY (Solana USDC, 0 SOL gas) or X402_PRIVATE_KEY (Base USDC, 0 ETH gas) for live swap simulation & smart-money orderflow ($0.010 USDC/call).";
export declare const X402_ENDPOINTS: {
    rugshield: string;
    canaryguard: string;
};
export declare const MCP_TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            token_address: {
                type: string;
                description: string;
            };
            chain: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            content?: undefined;
            strict_mode?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            content: {
                type: string;
                description: string;
            };
            strict_mode: {
                type: string;
                default: boolean;
                description: string;
            };
            token_address?: undefined;
            chain?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            limit: {
                type: string;
                default: number;
                description: string;
            };
            chain: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            token_address?: undefined;
            content?: undefined;
            strict_mode?: undefined;
        };
        required?: undefined;
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
    };
})[];
export declare function resolveX402PrivateKey(explicitKey?: string): `0x${string}` | undefined;
export declare function createSniperPayingFetch(privateKey: `0x${string}`, baseFetch?: typeof fetch): typeof fetch;
export interface VerifySnipeOptions {
    paymentSignature?: string;
    privateKey?: string;
    solanaPrivateKey?: string | Uint8Array | number[];
    solanaRpcUrl?: string;
    customFetch?: typeof fetch;
}
export declare function verifyTokenBeforeSnipe(tokenAddress: string, chain?: "base" | "solana", paymentOrOptions?: string | VerifySnipeOptions | undefined): Promise<{
    safeToExecute: boolean;
    chain: "base" | "solana";
    tokenAddress: string;
    buyTaxBps: null;
    sellTaxBps: null;
    smartMoneyNetflow24hUsd: null;
    sybilClustersDetected: null;
    paymentMode: "x402_paid" | "x402_header" | "free_preview";
    verdict: string;
    upgradeHint?: undefined;
} | {
    safeToExecute: boolean;
    chain: "base" | "solana";
    tokenAddress: string;
    buyTaxBps: any;
    sellTaxBps: any;
    smartMoneyNetflow24hUsd: any;
    sybilClustersDetected: any;
    paymentMode: "x402_paid" | "x402_header" | "free_preview";
    upgradeHint: string | undefined;
    verdict: any;
} | {
    safeToExecute: boolean;
    chain: "base" | "solana";
    tokenAddress: string;
    buyTaxBps: null;
    sellTaxBps: null;
    smartMoneyNetflow24hUsd: null;
    sybilClustersDetected: null;
    verdict: string;
    paymentMode?: undefined;
    upgradeHint?: undefined;
}>;
export declare function runSniperLoop(): Promise<void>;
export declare function executeMcpToolCall(toolName: string, args?: Record<string, any>, options?: VerifySnipeOptions): Promise<{
    validationError: string;
    unknownTool?: undefined;
    isError?: undefined;
    payload?: undefined;
} | {
    unknownTool: string;
    validationError?: undefined;
    isError?: undefined;
    payload?: undefined;
} | {
    isError: boolean;
    payload: any;
    validationError?: undefined;
    unknownTool?: undefined;
}>;
export declare function executeTerminalScan(tokenAddress: string): Promise<void>;
