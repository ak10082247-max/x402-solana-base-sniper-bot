#!/usr/bin/env node
/**
 * @kurox_real/x402-sniper-bot (v1.0.4)
 * -------------------------------------
 * Model Context Protocol (MCP) Read-Only Pre-Trade Security & Alpha Oracle for:
 *   1. Solana Mainnet (Pump.fun graduations, Raydium, Jupiter v6)
 *   2. Base Mainnet (Virtuals, Clanker, Aerodrome SlipStream, Uniswap V3)
 *   3. Polymarket CLOB Whale Divergence
 *
 * ZERO-CUSTODY GUARANTEE:
 * This server operates strictly as a read-only verification oracle. It requires
 * ZERO private keys, ZERO seed phrases, and holds ZERO custody of user funds.
 */
export declare const SERVICE_VERSION = "1.0.9";
export declare const X402_ENDPOINTS: {
    rugshield: string;
    canaryguard: string;
    stealthguard: string;
    tollbooth: string;
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
export interface PreTradeVerdict {
    safeToExecute: boolean;
    chain: "solana" | "base";
    tokenAddress: string;
    buyTaxBps: number;
    sellTaxBps: number;
    smartMoneyNetflow24hUsd: number;
    sybilClustersDetected: number;
    verdict: string;
}
export declare function verifyTokenBeforeSnipe(tokenAddress: string, chain?: "solana" | "base", paymentSignature?: string): Promise<PreTradeVerdict>;
export declare function runSniperLoop(): Promise<void>;
export declare function executeTerminalScan(tokenAddress: string): Promise<void>;
