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

import * as readline from "readline";

export const SERVICE_VERSION = "1.0.9";

export const X402_ENDPOINTS = {
  rugshield: process.env.RUGSHIELD_URL || "https://rugshield-402.onrender.com",
  canaryguard: process.env.CANARYGUARD_URL || "https://canaryguard-402.onrender.com",
};

export const MCP_TOOLS = [
  {
    name: "rugshield_pre_trade_scan",
    description: "MANDATORY PRE-TRADE HONEYPOT GATE: Simulates buy/sell transactions on Base and Solana DEXes, detects malicious transfer taxes, transfer locks, and hidden owner blacklists. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        token_address: { type: "string", description: "Base ERC-20 contract or Solana SPL mint address to audit" },
        chain: { type: "string", enum: ["base", "solana"], default: "base", description: "Blockchain network" },
      },
      required: ["token_address"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "smart_money_netflow_tracker",
    description: "Tracks institutional and high-win-rate whale wallet net inflows and outflows across Solana SPL and Base ERC-20 tokens over 1h, 24h, and 7d. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        token_address: { type: "string", description: "Target token address to track netflow" },
        chain: { type: "string", enum: ["base", "solana"], default: "base", description: "Blockchain network" },
      },
      required: ["token_address"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "smart_money_dex_trades",
    description: "Live smart-money DEX trade feed across Jupiter, Raydium, Aerodrome, and Uniswap V3. Shows real-time whale buyer entries and trade sizes. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        token_address: { type: "string", description: "Token address to filter DEX trades" },
        chain: { type: "string", enum: ["base", "solana"], default: "base", description: "Blockchain network" },
      },
      required: ["token_address"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "canary_sanitize_prompt",
    description: "Deterministic prompt-injection firewall and token metadata scrubber for trading agents. Blocks injected wallet-draining commands and malicious instructions. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Untrusted token description, prompt text, or web scrape to sanitize" },
        strict_mode: { type: "boolean", default: true, description: "Whether to apply aggressive heuristic scrubbing" },
      },
      required: ["content"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: "solana_base_alpha_radar",
    description: "Real-time feed of newly graduated tokens from Pump.fun and Aerodrome with verified honeypot, liquidity depth, and whale netflow metrics. Price: 0.010 USDC.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 5, description: "Number of alerts to return (max 20)" },
        chain: { type: "string", enum: ["base", "solana", "all"], default: "all", description: "Target ecosystem" },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
];

export interface PreTradeVerdict {
  safeToExecute: boolean;
  chain: "solana" | "base";
  tokenAddress: string;
  buyTaxBps: number | null;
  sellTaxBps: number | null;
  smartMoneyNetflow24hUsd: number | null;
  sybilClustersDetected: number | null;
  verdict: string;
}

export async function verifyTokenBeforeSnipe(
  tokenAddress: string,
  chain: "solana" | "base" = tokenAddress.startsWith("0x") ? "base" : "solana",
  paymentSignature: string | undefined = process.env.RUGSHIELD_PAYMENT_HEADER
): Promise<PreTradeVerdict> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (paymentSignature) {
    headers["PAYMENT-SIGNATURE"] = paymentSignature;
  }

  const endpointPath = paymentSignature ? "/v1/scan" : "/v1/scan/preview";
  try {
    const scanUrl = `${X402_ENDPOINTS.rugshield}${endpointPath}`;
    const res = await fetch(scanUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ token_address: tokenAddress, chain, simulate_sell: true }),
      signal: AbortSignal.timeout(8000),
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
  process.stderr.write("🚀 @kurox_real/x402-sniper-bot — Read-Only Pre-Trade Security Oracle\n");
  process.stderr.write("🛡️ Pre-Trade Honeypot & Whale Netflow Oracle: ACTIVE ($0.010 USDC)\n");
  process.stderr.write("==================================================================\n");

  try {
    const feedRes = await fetch(`${X402_ENDPOINTS.rugshield}/v1/feed/live-alerts`, { signal: AbortSignal.timeout(6000) });
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
// MCP JSON-RPC 2.0 Stdio Transport (Compatible with MCPpedia, Glama, Claude, Cursor)
// ============================================================================
async function callUpstreamJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; body: any; paymentRequiredHeader?: string | null }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED");
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body, paymentRequiredHeader };
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
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: {
          name: "@kurox_real/x402-sniper-bot",
          version: SERVICE_VERSION,
        },
      },
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "ping") {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: {} }) + "\n");
    return;
  }

  if (method === "tools/list") {
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        tools: MCP_TOOLS,
      },
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};

    try {
      const rugHeader = process.env.RUGSHIELD_PAYMENT_HEADER;
      const canaryHeader = process.env.CANARYGUARD_PAYMENT_HEADER;
      let upstream: { ok: boolean; status: number; body: any; paymentRequiredHeader?: string | null };

      if (toolName === "rugshield_pre_trade_scan") {
        if (!args.token_address || typeof args.token_address !== "string") {
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: "token_address is required" } }) + "\n");
          return;
        }
        const path = rugHeader ? "/v1/scan" : "/v1/scan/preview";
        const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
        if (rugHeader) headers["PAYMENT-SIGNATURE"] = rugHeader;
        upstream = await callUpstreamJson(`${X402_ENDPOINTS.rugshield}${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ token_address: args.token_address, chain: args.chain || "base", simulate_sell: true }),
        });
      } else if (toolName === "smart_money_netflow_tracker" || toolName === "smart_money_dex_trades") {
        if (!args.token_address || typeof args.token_address !== "string") {
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: "token_address is required" } }) + "\n");
          return;
        }
        const route = toolName === "smart_money_netflow_tracker" ? "/api/v1/smart-money/netflow" : "/api/v1/smart-money/dex-trades";
        const qs = new URLSearchParams({ token_address: args.token_address, chain: String(args.chain || "base") });
        const headers: Record<string, string> = { Accept: "application/json" };
        if (rugHeader) headers["PAYMENT-SIGNATURE"] = rugHeader;
        upstream = await callUpstreamJson(`${X402_ENDPOINTS.rugshield}${route}?${qs.toString()}`, { method: "GET", headers });
      } else if (toolName === "canary_sanitize_prompt") {
        if (!args.content || typeof args.content !== "string") {
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: "content is required" } }) + "\n");
          return;
        }
        const path = canaryHeader ? "/v1/sanitize" : "/v1/sanitize/preview";
        const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
        if (canaryHeader) headers["PAYMENT-SIGNATURE"] = canaryHeader;
        upstream = await callUpstreamJson(`${X402_ENDPOINTS.canaryguard}${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: args.content, strict_mode: args.strict_mode ?? true }),
        });
      } else if (toolName === "solana_base_alpha_radar") {
        const qs = new URLSearchParams({ limit: String(args.limit ?? 5), chain: String(args.chain || "all") });
        upstream = await callUpstreamJson(`${X402_ENDPOINTS.rugshield}/v1/feed/live-alerts?${qs.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } else {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${String(toolName)}` } }) + "\n");
        return;
      }

      if (!upstream.ok) {
        process.stdout.write(JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [{
              type: "text",
              text: JSON.stringify({
                error: upstream.status === 402 ? "PAYMENT_REQUIRED_402" : `UPSTREAM_HTTP_${upstream.status}`,
                status: upstream.status,
                details: upstream.body,
                payment_required_header: upstream.paymentRequiredHeader || null,
              }),
            }],
          },
        }) + "\n");
        return;
      }

      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(upstream.body) }],
        },
      }) + "\n");
      return;
    } catch (err: any) {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{ type: "text", text: JSON.stringify({ error: "UPSTREAM_UNREACHABLE", message: err?.message || String(err) }) }],
        },
      }) + "\n");
      return;
    }
  }

  // Fallback for unknown methods
  process.stdout.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }) + "\n"
  );
}

// ============================================================================
// Direct Terminal Scanner & CLI Runner
// ============================================================================
export async function executeTerminalScan(tokenAddress: string) {
  const chain = tokenAddress.startsWith("0x") ? "base" : "solana";
  console.log(`\n\x1b[36m==================================================================\x1b[0m`);
  console.log(`\x1b[1m🛡️  RUGSHIELD 402 — PRE-TRADE TOKEN SIMULATION & AUDIT\x1b[0m`);
  console.log(`\x1b[36m==================================================================\x1b[0m`);
  console.log(`🔍 Target Token : \x1b[33m${tokenAddress}\x1b[0m`);
  console.log(`🌐 Ecosystem    : \x1b[35m${chain.toUpperCase()} MAINNET\x1b[0m`);
  console.log(`⏳ Simulating pre-trade state-override swap...`);

  try {
    const res = await fetch(`${X402_ENDPOINTS.rugshield}/v1/scan/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token_address: tokenAddress, chain, simulate_sell: true }),
      signal: AbortSignal.timeout(8000),
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
          : `\x1b[33m[PREVIEW ONLY: ${data.simulation_status || data.recommendation || "PAY /v1/scan ($0.010 USDC) FOR SIMULATION"}]\x1b[0m`;

      console.log(`──────────────────────────────────────────────────────────────────`);
      console.log(`🚨 Honeypot Gate   : ${honeypotLine}`);
      console.log(`💸 Taxes Detected  : Buy: ${buyTax} | Sell: ${sellTax}`);
      console.log(`💧 Verified Pool   : \x1b[36m${liquidity}\x1b[0m`);
      console.log(`👥 Dev Clusters    : \x1b[33m${clusters}\x1b[0m`);
      console.log(`🏆 Final Verdict   : ${verdict}`);
      console.log(`──────────────────────────────────────────────────────────────────`);
      console.log(`📊 Live Web Terminal : \x1b[34mhttps://rugshield-402.onrender.com/?token=${tokenAddress}\x1b[0m`);
      console.log(`⚡ Solana Action/Blink: \x1b[34mhttps://rugshield-402.onrender.com/api/actions/scan?token=${tokenAddress}\x1b[0m`);
      console.log(`\x1b[36m==================================================================\x1b[0m\n`);
      return;
    }

    console.error(`\x1b[31m❌ RugShield preview failed with HTTP ${res.status}. Fail-closed (no synthetic result generated).\x1b[0m`);
  } catch (err: any) {
    console.error(`\x1b[31m❌ RugShield preview unavailable: ${err?.message || String(err)}. Fail-closed (no synthetic result generated).\x1b[0m`);
  }
}

// ============================================================================
// CLI & MCP Server Startup Dispatcher
// ============================================================================
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

\x1b[33mExamples:\x1b[0m
  npx @kurox_real/x402-sniper-bot scan DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
  npx @kurox_real/x402-sniper-bot scan 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
`);
    process.exit(0);
  }

  let scanToken: string | null = null;
  const scanIndex = args.indexOf("scan");
  if (scanIndex !== -1 && args[scanIndex + 1]) {
    scanToken = args[scanIndex + 1];
  } else {
    // Check if an argument looks like a base58 address or 0x evm address
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

  // MCP JSON-RPC Server Mode over stdio
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
    process.stderr.write(`💡 Tip: Run 'npx @kurox_real/x402-sniper-bot scan <TOKEN>' to audit a token directly in your terminal.\n`);
    process.stderr.write(`Waiting for JSON-RPC 2.0 messages on stdin...\n`);
  }
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
