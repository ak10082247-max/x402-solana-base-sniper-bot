#!/usr/bin/env node
/**
 * @kurox_real/x402-sniper-bot
 * ---------------------------
 * Production-ready autonomous sniper & whale-following trading agent for:
 *   1. Solana Mainnet (Pump.fun graduations, Raydium CLMM, Jupiter v6)
 *   2. Base Mainnet (Clanker, Virtuals, Aerodrome SlipStream, Uniswap V3)
 *   3. Polymarket CLOB Whale Divergence
 *
 * Pre-wired with mandatory x402 v2 pre-trade security & Nansen-compatible smart-money gates:
 *   - RugShield 402:   https://rugshield-402.onrender.com
 *   - CanaryGuard 402: https://canaryguard-402.onrender.com
 *   - StealthGuard 402: https://stealthguard-402.onrender.com
 *   - Agent Tollbooth: https://x402-agent-tollbooth.onrender.com
 */
export declare const X402_ENDPOINTS: {
    rugshield: string;
    canaryguard: string;
    stealthguard: string;
    tollbooth: string;
};
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
/**
 * Mandatory pre-swap gate executed before any Jupiter (Solana) or Aerodrome/Uniswap (Base) swap.
 * Supports both Base Mainnet (eip155:8453) and Solana Mainnet (solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp)
 * x402 v2 settlement via Coinbase CDP or PayAI Facilitator (https://facilitator.payai.network).
 */
export declare function verifyTokenBeforeSnipe(tokenAddress: string, chain?: "solana" | "base", paymentSignature?: string): Promise<PreTradeVerdict>;
export declare function runSniperLoop(): Promise<void>;
