# ⚡ x402 Solana (Pump.fun / Jupiter) + Base + Polymarket AI Sniper Bot

Autonomous dual-chain trading bot template for **Solana Mainnet** (Pump.fun graduations, Raydium, Jupiter v6), **Base Mainnet** (Virtuals, Clanker, Aerodrome, Uniswap V3), and **Polymarket CLOB** whale divergence.

Pre-configured with the **Kurox 402 Security & Smart-Money Fleet** so autonomous agents (`Cursor`, `Claude Code`, `Solana Agent Kit`, `Coinbase AgentKit`, `ElizaOS`) never buy a honeypot, sybil dev-cluster rug, or prompt-injected token metadata trap.

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

## 🚀 Quick Start

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
