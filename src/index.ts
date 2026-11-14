#!/usr/bin/env node
/**
 * @kurox_real/x402-sniper-bot (v1.1.0)
 * -------------------------------------
 * Model Context Protocol (MCP) Pre-Trade Security & Alpha Oracle for:
 *   1. Solana Mainnet (Pump.fun graduations, Raydium, Jupiter v6)
 *   2. Base Mainnet (Virtuals, Clanker, Aerodrome SlipStream, Uniswap V3)
 *   3. CanaryGuard Prompt-Injection Firewall & Smart-Money Orderflow
 *
 * Non-custodial dual-chain x402 billing:
 *   - Solana Mainnet USDC (PayAI fee-sponsored, 0 SOL gas): set SOLANA_PRIVATE_KEY
 *   - Base Mainnet USDC (CDP / PayAI gasless EIP-3009): set X402_PRIVATE_KEY
 *   - Omit keys to evaluate free /preview endpoints.
 */
import * as readline from "readline";
import {
  createGuardPayingFetch,
  createGuardPayingFetchAsync,
  resolvePrivateKey as resolveGuardEvmKey,
  resolveSolanaPrivateKeyBytes,
  resolveSolanaRpcUrl,
} from "@kurox_real/solana-agent-kit-guard";

export const SERVICE_VERSION = "1.1.0";

export const X402_UPGRADE_HINT =
  "Evaluated via free preview. Set SOLANA_PRIVATE_KEY (Solana USDC, 0 SOL gas) or X402_PRIVATE_KEY (Base USDC, 0 ETH gas) for live swap simulation & smart-money orderflow ($0.010 USDC/call).";

export const X402_ENDPOINTS = {
  rugshield: process.env.RUGSHIELD_URL || "https://rugshield-402.onrender.com",
  canaryguard: process.env.CANARYGUARD_URL || "https://canaryguard-402.onrender.com",
};

export const MCP_TOOLS = [
  {
    name: "rugshield_pre_trade_scan",
    description:
      "MANDATORY PRE-TRADE HONEYPOT GATE: Simulates buy/sell transactions on Base and Solana DEXes, detects malicious transfer taxes, transfer locks, and hidden owner blacklists. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        token_address: {
          type: "string",
          description: "Base ERC-20 contract or Solana SPL mint address to audit",
        },
        chain: {
          type: "string",
          enum: ["base", "solana"],
          default: "base",
          description: "Blockchain network",
        },
      },
      required: ["token_address"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "smart_money_netflow_tracker",
    description:
      "Tracks institutional and high-win-rate whale wallet net inflows and outflows across Solana SPL and Base ERC-20 tokens over 1h, 24h, and 7d. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        token_address: { type: "string", description: "Target token address to track netflow" },
        chain: {
          type: "string",
          enum: ["base", "solana"],
          default: "base",
          description: "Blockchain network",
        },
      },
      required: ["token_address"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "smart_money_dex_trades",
    description:
      "Live smart-money DEX trade feed across Jupiter, Raydium, Aerodrome, and Uniswap V3. Shows real-time whale buyer entries and trade sizes. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        token_address: { type: "string", description: "Token address to filter DEX trades" },
        chain: {
          type: "string",
          enum: ["base", "solana"],
          default: "base",
          description: "Blockchain network",
        },
      },
      required: ["token_address"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "canary_sanitize_prompt",
    description:
      "Deterministic prompt-injection firewall and token metadata scrubber for trading agents. Blocks injected wallet-draining commands and malicious instructions. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Untrusted token description, prompt text, or web scrape to sanitize",
        },
        strict_mode: {
          type: "boolean",
          default: true,
          description: "Whether to apply aggressive heuristic scrubbing",
        },
      },
      required: ["content"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "solana_base_alpha_radar",
    description:
      "Real-time feed of newly graduated tokens from Pump.fun and Aerodrome with verified honeypot, liquidity depth, and whale netflow metrics.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 5, description: "Number of alerts to return (max 20)" },
        chain: {
          type: "string",
          enum: ["base", "solana", "all"],
          default: "all",
          description: "Target ecosystem",
        },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
];

export function resolveX402PrivateKey(explicitKey?: string): `0x${string}` | undefined {
  return resolveGuardEvmKey({ x402PrivateKey: explicitKey }, [
    "RUGSHIELD_PRIVATE_KEY",
    "RUGSHIELD_PAYMENT_PRIVATE_KEY",
    "CANARYGUARD_PRIVATE_KEY",
  ]);
}

export function createSniperPayingFetch(
  privateKey: `0x${string}`,
  baseFetch: typeof fetch = fetch,
): typeof fetch {
  return createGuardPayingFetch(privateKey, baseFetch);
}

export interface VerifySnipeOptions {
  paymentSignature?: string;
  privateKey?: string;
  solanaPrivateKey?: string | Uint8Array | number[];
  solanaRpcUrl?: string;
  customFetch?: typeof fetch;
}

async function resolveSniperCaller(
  opts: VerifySnipeOptions & { extraEvmKeys?: string[]; extraSolanaKeys?: string[]; staticEnvHeaderKey?: string },
) {
  const baseFetch = opts.customFetch ?? fetch;
  const evmPrivateKey = resolveGuardEvmKey({ x402PrivateKey: opts.privateKey }, opts.extraEvmKeys ?? [
    "RUGSHIELD_PRIVATE_KEY",
    "RUGSHIELD_PAYMENT_PRIVATE_KEY",
    "CANARYGUARD_PRIVATE_KEY",
  ]);
  const solanaSecretKeyBytes = resolveSolanaPrivateKeyBytes(
    { solanaPrivateKey: opts.solanaPrivateKey },
    opts.extraSolanaKeys ?? ["RUGSHIELD_SOLANA_PRIVATE_KEY", "CANARYGUARD_SOLANA_PRIVATE_KEY"],
  );
  const solanaRpcUrl = resolveSolanaRpcUrl({ solanaRpcUrl: opts.solanaRpcUrl });
  const paymentSignature =
    opts.paymentSignature ?? (opts.staticEnvHeaderKey ? process.env[opts.staticEnvHeaderKey] : undefined);

  const hasAutoPay = Boolean(evmPrivateKey || solanaSecretKeyBytes);
  const caller = hasAutoPay
    ? await createGuardPayingFetchAsync({ evmPrivateKey, solanaSecretKeyBytes, solanaRpcUrl }, baseFetch)
    : undefined;

  return {
    caller,
    baseFetch,
    paymentSignature,
    hasAutoPay,
    paymentMode: (hasAutoPay ? "x402_paid" : paymentSignature ? "x402_header" : "free_preview") as
      | "x402_paid"
      | "x402_header"
      | "free_preview",
    isPaid: Boolean(hasAutoPay || paymentSignature),
  };
}

export async function verifyTokenBeforeSnipe(
  tokenAddress: string,
  chain: "base" | "solana" = tokenAddress.startsWith("0x") ? "base" : "solana",
  paymentOrOptions: string | VerifySnipeOptions | undefined = process.env.RUGSHIELD_PAYMENT_HEADER,
) {
  const opts: VerifySnipeOptions =
    typeof paymentOrOptions === "string"
      ? { paymentSignature: paymentOrOptions }
      : paymentOrOptions || {};
  const ctx = await resolveSniperCaller({
    ...opts,
    staticEnvHeaderKey: "RUGSHIELD_PAYMENT_HEADER",
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (ctx.paymentSignature && !ctx.hasAutoPay) {
    headers["PAYMENT-SIGNATURE"] = ctx.paymentSignature;
  }

  const endpointPath = ctx.isPaid ? "/v1/scan" : "/v1/scan/preview";
  const caller = ctx.caller ?? ctx.baseFetch;

  try {
    const scanUrl = `${X402_ENDPOINTS.rugshield}${endpointPath}`;
    const res = await caller(scanUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ token_address: tokenAddress, chain, simulate_sell: true }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return {
        safeToExecute: false,
        chain,
        tokenAddress,
        buyTaxBps: null,
        sellTaxBps: null,
        smartMoneyNetflow24hUsd: null,
        sybilClustersDetected: null,
        paymentMode: ctx.paymentMode,
        verdict: res.status === 402 ? "PAYMENT_REQUIRED_402" : `SCAN_HTTP_${res.status}`,
      };
    }

    const data: any = await res.json();
    const buyTaxBps = typeof data.buy_tax_bps === "number" ? data.buy_tax_bps : null;
    const sellTaxBps = typeof data.sell_tax_bps === "number" ? data.sell_tax_bps : null;
    const sybilClustersDetected =
      typeof data.sybil_clusters === "number"
        ? data.sybil_clusters
        : typeof data.holder_risk?.sybil_clusters === "number"
          ? data.holder_risk.sybil_clusters
          : null;
    const smartMoneyNetflow24hUsd =
      typeof data.smart_money_netflow_24h_usd === "number" ? data.smart_money_netflow_24h_usd : null;

    const safeToExecute =
      data.is_honeypot === false &&
      sellTaxBps !== null &&
      sellTaxBps <= 1000 &&
      data.recommendation !== "HIGH_RISK_BLOCK";

    const verdict =
      data.is_honeypot === true
        ? "HONEYPOT_DETECTED"
        : data.is_honeypot === false
          ? data.recommendation || "SIMULATED_CLEAR"
          : data.simulation_status || "UNSIMULATED_PREVIEW_REQUIRES_PAID_SCAN";

    return {
      safeToExecute,
      chain,
      tokenAddress,
      buyTaxBps,
      sellTaxBps,
      smartMoneyNetflow24hUsd,
      sybilClustersDetected,
      paymentMode: ctx.paymentMode,
      upgradeHint: ctx.isPaid ? undefined : X402_UPGRADE_HINT,
      verdict,
    };
  } catch {
    return {
      safeToExecute: false,
      chain,
      tokenAddress,
      buyTaxBps: null,
      sellTaxBps: null,
      smartMoneyNetflow24hUsd: null,
      sybilClustersDetected: null,
      verdict: "SCAN_UNAVAILABLE",
    };
  }
}

export async function runSniperLoop() {
  process.stderr.write("==================================================================\n");
  process.stderr.write("🚀 @kurox_real/x402-sniper-bot — Non-Custodial Pre-Trade Security Oracle\n");
  process.stderr.write("🛡️ Pre-Trade Honeypot & Whale Netflow Oracle: ACTIVE ($0.010 USDC via x402)\n");
  process.stderr.write("==================================================================\n");

  try {
    const feedRes = await fetch(`${X402_ENDPOINTS.rugshield}/v1/feed/live-alerts`, {
      signal: AbortSignal.timeout(6000),
    });
    const feed: any = await feedRes.json();
    process.stderr.write(`[Feed] Loaded ${feed.alerts?.length || 0} live graduated token alerts.\n`);
    for (const alert of (feed.alerts || []).slice(0, 3)) {
      process.stderr.write(`-> Auditing [${alert.chain.toUpperCase()}] ${alert.symbol} (${alert.token_address})\n`);
      await verifyTokenBeforeSnipe(alert.token_address, alert.chain);
    }
  } catch (err: any) {
    process.stderr.write(`[Notice] Feed offline or unconfigured: ${err.message}\n`);
  }
}

// ============================================================================
// MCP JSON-RPC 2.0 Stdio Transport
// ============================================================================

async function callUpstreamJson(
  url: string,
  init: RequestInit,
  fetcher: typeof fetch = fetch,
) {
  const res = await fetcher(url, { ...init, signal: AbortSignal.timeout(15000) });
  const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED");
  const paymentResponseHeader = res.headers.get("PAYMENT-RESPONSE");
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body, paymentRequiredHeader, paymentResponseHeader };
}

export async function executeMcpToolCall(
  toolName: string,
  args: Record<string, any> = {},
  options?: VerifySnipeOptions,
) {
  const ctx = await resolveSniperCaller(options ?? {});
  const baseFetch = ctx.baseFetch;
  const payingFetch = ctx.caller;
  const rugHeader = process.env.RUGSHIELD_PAYMENT_HEADER;
  const canaryHeader = process.env.CANARYGUARD_PAYMENT_HEADER;

  let upstream: {
    ok: boolean;
    status: number;
    body: any;
    paymentRequiredHeader: string | null;
    paymentResponseHeader: string | null;
  };
  let usedFreePreview = false;

  if (toolName === "rugshield_pre_trade_scan") {
    if (!args.token_address || typeof args.token_address !== "string") {
      return { validationError: "token_address is required" };
    }
    const isPaid = Boolean(payingFetch || rugHeader);
    usedFreePreview = !isPaid;
    const path = isPaid ? "/v1/scan" : "/v1/scan/preview";
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (rugHeader && !payingFetch) headers["PAYMENT-SIGNATURE"] = rugHeader;
    upstream = await callUpstreamJson(
      `${X402_ENDPOINTS.rugshield}${path}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          token_address: args.token_address,
          chain: args.chain || (String(args.token_address).startsWith("0x") ? "base" : "solana"),
          simulate_sell: true,
        }),
      },
      payingFetch ?? baseFetch,
    );
  } else if (toolName === "smart_money_netflow_tracker" || toolName === "smart_money_dex_trades") {
    if (!args.token_address || typeof args.token_address !== "string") {
      return { validationError: "token_address is required" };
    }
    const route =
      toolName === "smart_money_netflow_tracker"
        ? "/api/v1/smart-money/netflow"
        : "/api/v1/smart-money/dex-trades";
    const qs = new URLSearchParams({
      token_address: args.token_address,
      chain: String(args.chain || (String(args.token_address).startsWith("0x") ? "base" : "solana")),
    });
    const headers: Record<string, string> = { Accept: "application/json" };
    if (rugHeader && !payingFetch) headers["PAYMENT-SIGNATURE"] = rugHeader;
    upstream = await callUpstreamJson(
      `${X402_ENDPOINTS.rugshield}${route}?${qs.toString()}`,
      { method: "GET", headers },
      payingFetch ?? baseFetch,
    );
  } else if (toolName === "canary_sanitize_prompt") {
    if (!args.content || typeof args.content !== "string") {
      return { validationError: "content is required" };
    }
    const isPaid = Boolean(payingFetch || canaryHeader);
    usedFreePreview = !isPaid;
    const path = isPaid ? "/v1/sanitize" : "/v1/sanitize/preview";
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (canaryHeader && !payingFetch) headers["PAYMENT-SIGNATURE"] = canaryHeader;
    upstream = await callUpstreamJson(
      `${X402_ENDPOINTS.canaryguard}${path}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ content: args.content, strict_mode: args.strict_mode ?? true }),
      },
      payingFetch ?? baseFetch,
    );
  } else if (toolName === "solana_base_alpha_radar") {
    const qs = new URLSearchParams({
      limit: String(args.limit ?? 5),
      chain: String(args.chain || "all"),
    });
    upstream = await callUpstreamJson(
      `${X402_ENDPOINTS.rugshield}/v1/feed/live-alerts?${qs.toString()}`,
      { method: "GET", headers: { Accept: "application/json" } },
      baseFetch,
    );
  } else {
    return { unknownTool: toolName };
  }

  if (!upstream.ok) {
    return {
      isError: true,
      payload: {
        error: upstream.status === 402 ? "PAYMENT_REQUIRED_402" : `UPSTREAM_HTTP_${upstream.status}`,
        status: upstream.status,
        details: upstream.body,
        payment_required_header: upstream.paymentRequiredHeader || null,
        setup_hint:
          upstream.status === 402
            ? "Set SOLANA_PRIVATE_KEY (Solana USDC via PayAI, 0 SOL gas) or X402_PRIVATE_KEY (Base USDC via EIP-3009, 0 ETH gas) so @kurox_real/x402-sniper-bot pays this x402 call automatically."
            : undefined,
      },
    };
  }

  const enrichedBody =
    usedFreePreview && upstream.body && typeof upstream.body === "object"
      ? {
          ...upstream.body,
          x402_payment_mode: "free_preview",
          x402_upgrade_hint: X402_UPGRADE_HINT,
        }
      : {
          ...(typeof upstream.body === "object" && upstream.body !== null ? upstream.body : { data: upstream.body }),
          ...(payingFetch ? { x402_payment_mode: "x402_paid", payment_response: upstream.paymentResponseHeader } : {}),
        };

  return { isError: false, payload: enrichedBody };
}

async function handleJsonRpc(line: string) {
  let req: any;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }

  const { id, method, params } = req;
  if (!method) return;

  if (method === "initialize") {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "@kurox_real/x402-sniper-bot", version: SERVICE_VERSION },
        },
      }) + "\n",
    );
    return;
  }

  if (method === "notifications/initialized") return;

  if (method === "ping") {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: {} }) + "\n");
    return;
  }

  if (method === "tools/list") {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } }) + "\n");
    return;
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};
    try {
      const outcome = await executeMcpToolCall(String(toolName || ""), args);
      if ("validationError" in outcome) {
        process.stdout.write(
          JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: outcome.validationError } }) + "\n",
        );
        return;
      }
      if ("unknownTool" in outcome) {
        process.stdout.write(
          JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${outcome.unknownTool}` } }) + "\n",
        );
        return;
      }
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            ...(outcome.isError ? { isError: true } : {}),
            content: [{ type: "text", text: JSON.stringify(outcome.payload) }],
          },
        }) + "\n",
      );
      return;
    } catch (err: any) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [{ type: "text", text: JSON.stringify({ error: "UPSTREAM_UNREACHABLE", message: err?.message || String(err) }) }],
          },
        }) + "\n",
      );
      return;
    }
  }

  process.stdout.write(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } }) + "\n",
  );
}

// ============================================================================
// Direct Terminal Scanner & CLI Runner
// ============================================================================

export async function executeTerminalScan(tokenAddress: string) {
  const chain = tokenAddress.startsWith("0x") ? "base" : "solana";
  const ctx = await resolveSniperCaller({ staticEnvHeaderKey: "RUGSHIELD_PAYMENT_HEADER" });
  const caller = ctx.caller ?? ctx.baseFetch;
  const endpoint = `${X402_ENDPOINTS.rugshield}${ctx.isPaid ? "/v1/scan" : "/v1/scan/preview"}`;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (ctx.paymentSignature && !ctx.hasAutoPay) headers["PAYMENT-SIGNATURE"] = ctx.paymentSignature;

  console.log(`\n\x1b[36m==================================================================\x1b[0m`);
  console.log(`\x1b[1m🛡️  RUGSHIELD 402 — PRE-TRADE TOKEN SIMULATION & AUDIT\x1b[0m`);
  console.log(`\x1b[36m==================================================================\x1b[0m`);
  console.log(`🔍 Target Token : \x1b[33m${tokenAddress}\x1b[0m`);
  console.log(`🌐 Ecosystem    : \x1b[35m${chain.toUpperCase()} MAINNET\x1b[0m`);
  console.log(`💳 Billing Mode : ${ctx.hasAutoPay ? "\x1b[32mx402 Auto-Pay (/v1/scan)\x1b[0m" : ctx.paymentSignature ? "\x1b[32mStatic PAYMENT-SIGNATURE (/v1/scan)\x1b[0m" : "\x1b[33mFree Preview (/v1/scan/preview)\x1b[0m"}`);
  console.log(`⏳ Simulating pre-trade state-override swap...`);

  try {
    const res = await caller(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ token_address: tokenAddress, chain, simulate_sell: true }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data: any = await res.json();
      const buyTax = typeof data.buy_tax_bps === "number" ? `${(data.buy_tax_bps / 100).toFixed(1)}%` : "N/A (paid /v1/scan required)";
      const sellTax = typeof data.sell_tax_bps === "number" ? `${(data.sell_tax_bps / 100).toFixed(1)}%` : "N/A (paid /v1/scan required)";
      const liquidity = typeof data.liquidity_usd === "number" ? `$${Number(data.liquidity_usd).toLocaleString()}` : "N/A (paid /v1/scan required)";
      const clusters = typeof data.sybil_clusters === "number" ? `${data.sybil_clusters} suspicious wallet rings` : "N/A (paid /v1/scan required)";
      const honeypotLine =
        data.is_honeypot === true
          ? "\x1b[31mFAIL (Honeypot Detected)\x1b[0m"
          : data.is_honeypot === false
            ? "\x1b[32mPASS (Liquidatable)\x1b[0m"
            : `\x1b[33mUNSIMULATED (${data.simulation_status || "paid /v1/scan required"})\x1b[0m`;
      const verdict =
        data.is_honeypot === true
          ? "\x1b[31m[DANGER: HONEYPOT DETECTED]\x1b[0m"
          : data.is_honeypot === false
            ? "\x1b[32m[PASSED: SAFE TO SWAP]\x1b[0m"
            : `\x1b[33m[PREVIEW ONLY: ${data.simulation_status || data.recommendation || "SET X402_PRIVATE_KEY FOR PAID /v1/scan ($0.010 USDC)"}]\x1b[0m`;

      console.log(`──────────────────────────────────────────────────────────────────`);
      console.log(`🚨 Honeypot Gate   : ${honeypotLine}`);
      console.log(`💸 Taxes Detected  : Buy: ${buyTax} | Sell: ${sellTax}`);
      console.log(`💧 Verified Pool   : \x1b[36m${liquidity}\x1b[0m`);
      console.log(`👥 Dev Clusters    : \x1b[33m${clusters}\x1b[0m`);
      console.log(`🏆 Final Verdict   : ${verdict}`);
      if (!ctx.isPaid) {
        console.log(`💡 Paid Upgrade    : \x1b[33mSet SOLANA_PRIVATE_KEY (Solana USDC, 0 SOL gas) or X402_PRIVATE_KEY (Base USDC, 0 ETH gas) for full paid simulation\x1b[0m`);
      }
      console.log(`──────────────────────────────────────────────────────────────────`);
      console.log(`📊 Live Web Terminal : \x1b[34mhttps://rugshield-402.onrender.com/?token=${tokenAddress}\x1b[0m`);
      console.log(`⚡ Solana Action/Blink: \x1b[34mhttps://rugshield-402.onrender.com/api/actions/scan?token=${tokenAddress}\x1b[0m`);
      console.log(`\x1b[36m==================================================================\x1b[0m\n`);
      return;
    }

    console.error(`\x1b[31m❌ RugShield scan failed with HTTP ${res.status}. Fail-closed (no synthetic result generated).\x1b[0m`);
  } catch (err: any) {
    console.error(`\x1b[31m❌ RugShield scan unavailable: ${err?.message || String(err)}. Fail-closed (no synthetic result generated).\x1b[0m`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help") || (args.length === 1 && args[0] === "help")) {
    console.log(`
\x1b[1m🛡️  @kurox_real/x402-sniper-bot (v${SERVICE_VERSION})\x1b[0m
─────────────────────────────────────────────────────────────
Pre-Trade Security & Alpha Oracle for Solana & Base Mainnet

\x1b[33mUsage:\x1b[0m
  npx @kurox_real/x402-sniper-bot scan <TOKEN_ADDRESS>   Audit an SPL Mint or ERC-20 contract
  npx @kurox_real/x402-sniper-bot --demo                 Run live graduated token alert stream
  npx @kurox_real/x402-sniper-bot                        Start MCP stdio JSON-RPC server (Claude, Cursor)

\x1b[33mPaid x402 Auto-Signing (Dual-Chain Gasless):\x1b[0m
  export SOLANA_PRIVATE_KEY=<base58> # Solana USDC wallet auto-signs via PayAI (@x402/svm, 0 SOL gas)
  export X402_PRIVATE_KEY=0x...      # Base USDC wallet auto-signs via EIP-3009 (@x402/evm, 0 ETH gas)
`);
    process.exit(0);
  }

  let scanToken: string | null = null;
  const scanIndex = args.indexOf("scan");
  if (scanIndex !== -1 && args[scanIndex + 1]) {
    scanToken = args[scanIndex + 1];
  } else {
    const candidate = args.find((a) => !a.startsWith("-"));
    if (candidate && (candidate.startsWith("0x") || candidate.length >= 32)) {
      scanToken = candidate;
    }
  }

  if (scanToken) {
    await executeTerminalScan(scanToken);
    return;
  }

  if (args.includes("--demo") || (process.stdin.isTTY && args.includes("--loop"))) {
    await runSniperLoop();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    void handleJsonRpc(line);
  });

  if (process.stdin.isTTY && args.length === 0) {
    process.stderr.write(`\x1b[36m🛡️  @kurox_real/x402-sniper-bot (v${SERVICE_VERSION}) — Running in MCP JSON-RPC Server Mode\x1b[0m\n`);
    process.stderr.write(`💡 Tip: Run 'npx @kurox_real/x402-sniper-bot scan <TOKEN>' or set SOLANA_PRIVATE_KEY / X402_PRIVATE_KEY for full paid simulation.\n`);
    process.stderr.write(`Waiting for JSON-RPC 2.0 messages on stdin...\n`);
  }
}

const isMainEntry =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  /index\.(js|ts)$/.test(process.argv[1].replace(/\\/g, "/"));

if (isMainEntry) {
  main().catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
  });
}
