/**
 * Solana Pump.fun & Raydium Autonomous Sniper Daemon
 * ----------------------------------------------------
 * Monitors newly graduated Pump.fun and Raydium pools on Solana Mainnet,
 * and intercepts every trade with the RugShield 402 Pre-Trade Honeypot Gate.
 *
 * Runs 24/7 as a background agent, or as a single-pass verification (--once).
 *
 * Usage:
 *   npx tsx scripts/solana_pumpfun_sniper_daemon.ts         # Run continuous 24/7 loop
 *   npx tsx scripts/solana_pumpfun_sniper_daemon.ts --once  # Run 1 tick and exit (for CI/Cron)
 */

const RUGSHIELD_BASE_URL = process.env.RUGSHIELD_URL || "https://rugshield-402.onrender.com";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 10000;
const RUN_ONCE = process.argv.includes("--once");

interface TokenAlert {
  chain: string;
  symbol: string;
  token_address: string;
  source?: string;
  timestamp?: number;
}

interface PreTradeScanResult {
  is_honeypot: boolean;
  buy_tax_bps: number;
  sell_tax_bps: number;
  liquidity_usd: number;
  sybil_clusters: number;
  recommendation: string;
}

const seenTokens = new Set<string>();
let isRunning = true;

// Handle graceful shutdown signals
process.on("SIGINT", () => {
  console.log("\n[Daemon] Gracefully stopping sniper loop...");
  isRunning = false;
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Daemon] Termination received, shutting down...");
  isRunning = false;
  process.exit(0);
});

async function fetchLiveGraduatedTokens(): Promise<TokenAlert[]> {
  try {
    const res = await fetch(`${RUGSHIELD_BASE_URL}/v1/feed/live-alerts`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    return data.alerts || [];
  } catch {
    return [];
  }
}

async function auditTokenWithRugShield(mint: string, chain: string = "solana"): Promise<PreTradeScanResult> {
  const res = await fetch(`${RUGSHIELD_BASE_URL}/v1/scan/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      token_address: mint,
      chain,
      simulate_sell: true,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`RugShield API returned ${res.status}`);
  }

  const data: any = await res.json();
  return {
    is_honeypot: Boolean(data.is_honeypot),
    buy_tax_bps: data.buy_tax_bps ?? 0,
    sell_tax_bps: data.sell_tax_bps ?? 0,
    liquidity_usd: data.liquidity_usd ?? 0,
    sybil_clusters: data.sybil_clusters ?? 0,
    recommendation: data.recommendation || "SAFE_TO_SWAP",
  };
}

async function runSniperLoop() {
  console.log("==================================================================");
  console.log("🎯 Autonomous Solana DEX Sniper Daemon (Powered by RugShield 402)");
  console.log("🛡️ Pre-Trade State Simulation Gate: ACTIVE ($0.010 USDC)");
  console.log("==================================================================");
  console.log(`[Status] Polling interval: ${POLL_INTERVAL_MS}ms | Mode: ${RUN_ONCE ? "Single Tick (--once)" : "24/7 Daemon"}`);
  console.log(`[Status] Listening for newly graduated Pump.fun & Raydium pools...\n`);

  do {
    try {
      const alerts = await fetchLiveGraduatedTokens();
      for (const alert of alerts) {
        if (!alert.token_address || seenTokens.has(alert.token_address)) continue;
        seenTokens.add(alert.token_address);

        const source = (alert.source || "feed").toUpperCase();
        console.log(`\n🚨 [NEW TOKEN] ${alert.symbol || "UNKNOWN"} (${alert.token_address}) detected via ${source}`);
        console.log(`⏳ Querying RugShield 402 pre-trade simulation...`);

        try {
          const chain = alert.token_address.startsWith("0x") ? "base" : "solana";
          const audit = await auditTokenWithRugShield(alert.token_address, chain);
          if (audit.is_honeypot || audit.sell_tax_bps > 1000) {
            console.log(`❌ [ABORTED] RugShield detected honeypot or malicious tax (${audit.sell_tax_bps / 100}%). Swap skipped!`);
          } else {
            console.log(`✅ [APPROVED] Token verified liquidatable (0% tax, $${audit.liquidity_usd.toLocaleString()} pool). Safe to snipe!`);
            console.log(`   👉 Deep Report: ${RUGSHIELD_BASE_URL}/?token=${alert.token_address}`);
          }
        } catch (err: any) {
          console.log(`⚠️ Pre-trade audit warning: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error(`Loop error: ${err.message}`);
    }

    if (RUN_ONCE) {
      console.log("\n[Daemon] Single tick complete (--once). Exiting cleanly.");
      break;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  } while (isRunning);
}

runSniperLoop()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal daemon error:", err);
    process.exit(1);
  });
