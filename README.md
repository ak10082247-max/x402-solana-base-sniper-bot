# ⚡ x402 Security Oracle & DEX Alpha Sentinel for Solana, Base & Polymarket

**Read-only pre-trade honeypot simulation, mempool front-running risk detection, and smart-money DEX oracle** for **Solana Mainnet** (Pump.fun graduations, Raydium, Jupiter v6), **Base Mainnet** (Virtuals, Clanker, Aerodrome, Uniswap V3), and **Polymarket CLOB** whale divergence.

> **Security & Zero-Custody Guarantee**: This MCP server is strictly a **read-only verification oracle and intelligence client**. It requires **zero private keys, zero wallet seed phrases, and holds zero custody of user funds**. Pre-trade simulation runs purely through read-only RPC calldata simulation and cryptographic attestation via x402 v2 micropayments.

Pre-configured with the **Kurox 402 Security & Smart-Money Fleet** so autonomous agents (`Cursor`, `Claude Code`, `Solana Agent Kit`, `Coinbase AgentKit`, `ElizaOS`) never buy a honeypot, sybil dev-cluster rug, or prompt-injected token metadata trap.

---

## ⚡ 1-Command Pre-Trade Honeypot Scan (Zero-Install CLI)

Audit any **Solana SPL Mint** or **Base ERC-20 contract** directly in your terminal in under 2 seconds — with zero configuration and zero API keys:

```bash
# Scan any Solana SPL Token Mint (e.g. BONK)
npx -y @kurox_real/x402-sniper-bot scan DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

# Scan any Base ERC-20 Contract (e.g. USDC)
npx -y @kurox_real/x402-sniper-bot scan 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

---

## 🔥 Live 1-Click Web Terminal & Solana Blinks

- **RugShield 402 Terminal**: [https://rugshield-402.onrender.com](https://rugshield-402.onrender.com)
- **CanaryGuard 402 Terminal**: [https://canaryguard-402.onrender.com](https://canaryguard-402.onrender.com)
- **StealthGuard 402 Terminal**: [https://stealthguard-402.onrender.com](https://stealthguard-402.onrender.com)
- **x402 Agent Tollbooth**: [https://x402-agent-tollbooth.onrender.com](https://x402-agent-tollbooth.onrender.com)
- **Live Graduated Token Alerts Feed**: [https://rugshield-402.onrender.com/v1/feed/live-alerts](https://rugshield-402.onrender.com/v1/feed/live-alerts)

---

## 💎 Nansen-Compatible x402 v2 Routes at an 80% Discount (`$0.010 USDC`)

All endpoints accept **both** **Solana Mainnet USDC** (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` via PayAI Facilitator `https://facilitator.payai.network`) and **Base Mainnet USDC** (`eip155:8453` via Coinbase CDP Facilitator):

| Route | Method | Price | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/token-screener` | `POST` / `GET` | `$0.010 USDC` | Real-time Solana & Base token screener with honeypot & liquidity filter |
| `/api/v1/smart-money/netflow` | `POST` / `GET` | `$0.010 USDC` | Smart-money whale wallet 24h netflow tracker on Solana & Base |
| `/api/v1/smart-money/dex-trades` | `POST` / `GET` | `$0.010 USDC` | Live smart-money DEX swap execution feed across Jupiter, Raydium, Aerodrome & Uniswap |
| `/api/v1/tgm/who-bought-sold` | `POST` / `GET` | `$0.010 USDC` | Token God Mode (TGM): Top buyers & sellers breakdown by wallet cohort |
| `/api/v1/tgm/holders` | `POST` / `GET` | `$0.010 USDC` | Token God Mode (TGM): Top holder concentration, sybil cluster & LP lock breakdown |
| `/api/v1/profiler/address/current-balance` | `POST` / `GET` | `$0.010 USDC` | Wallet Address Profiler: Current portfolio balances, PnL & counterparty safety |

---

## 🚀 1-Click Desktop MCP Installation (Claude Desktop, Cursor, Windsurf, Cline)

Install this oracle directly into your AI coding agent with one copy-paste configuration:

### 1. Claude Desktop (`claude_desktop_config.json`)
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kurox-oracle": {
      "command": "npx",
      "args": ["-y", "@kurox_real/x402-sniper-bot"]
    },
    "canaryguard": {
      "url": "https://canaryguard-402.onrender.com/mcp"
    }
  }
}
```

### 2. Cursor (`.cursor/mcp.json` or Cursor Settings -> Features -> MCP)
```json
{
  "mcpServers": {
    "kurox-oracle": {
      "command": "npx",
      "args": ["-y", "@kurox_real/x402-sniper-bot"]
    }
  }
}
```

### 3. Windsurf & Cline (VS Code)
```json
{
  "mcpServers": {
    "kurox-oracle": {
      "command": "npx",
      "args": ["-y", "@kurox_real/x402-sniper-bot"]
    }
  }
}
```

---

## 🚀 Quick Start (Local NPM / Git)

```bash
git clone https://github.com/ak10082247-max/x402-solana-base-sniper-bot.git
cd x402-solana-base-sniper-bot
npm install
npm run dev
```

### Pre-Installed Official SDKs
- `@kurox_real/rugshield-client`
- `@kurox_real/canaryguard-client`
- `@kurox_real/stealthguard-client`
- `@kurox_real/solana-agent-kit-guard`
