# Kurox x402 Live Dual-Chain Alpha Signals (Solana & Base)

> **Real-Time Pre-Trade Honeypot & Insider Detection Feed**  
> Powered by [RugShield 402](https://rugshield-402.onrender.com) & [CanaryGuard 402](https://canaryguard-402.onrender.com)  
> Monitored via Dual-Chain x402 V2 Micro-Payments on Base (`eip155:8453`) & Solana (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`)

---

## ⚡ 1-Click Interactive Web Terminal
Traders and agents can unlock complete institutional security scans (exact insider funding trees, honeypot calldata simulations, and smart-money netflow) with 1 click in your browser or agent workflow:
- **Solana Web Terminal**: Connect Phantom/Solflare and unlock for **$0.01 USDC** (gas sponsored by PayAI)
- **Base Web Terminal**: Connect Coinbase Wallet/MetaMask and unlock for **$0.01 USDC** (gasless EIP-3009)

---

## 🚀 Autonomous Terminal / Agent Execution
Run instant risk checks on any token directly from your terminal:
```bash
# 1-Click scan via npx
npx @kurox_real/x402-sniper-bot --token <TOKEN_ADDRESS> --chain <solana|base>

# Or call direct dual-chain MCP server
curl -X POST https://rugshield-402.onrender.com/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"token_address": "2e3zQiA8JWeDjjVeuqzv9X1Q3aqRRaPqL8UYEbxVpump", "chain": "solana"}'
```

---

## 📡 Live Trending Signals (Updated Every 15 Minutes)

| Chain | Symbol | Address | Liquidity | Risk Teaser | 1-Click Unlock Links |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **SOL** | `$NUBI` | `2e3zQiA8JWeDjjVeuqzv9X1Q3aqRRaPqL8UYEbxVpump` | `$42,000` | Top-10 ~28.4% (3 clusters) | [⚡ Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=2e3zQiA8JWeDjjVeuqzv9X1Q3aqRRaPqL8UYEbxVpump) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=2e3zQiA8JWeDjjVeuqzv9X1Q3aqRRaPqL8UYEbxVpump) |
| **SOL** | `$PROINU` | `7NPvxgxdDKgTHSzcWoV5mCp5opNA4uTpzrPynXDXpump` | `$38,500` | Top-10 ~35.1% (4 clusters) | [⚡ Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=7NPvxgxdDKgTHSzcWoV5mCp5opNA4uTpzrPynXDXpump) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=7NPvxgxdDKgTHSzcWoV5mCp5opNA4uTpzrPynXDXpump) |
| **SOL** | `$XSTOK` | `nPD9vif19C2oY1jhHRrAJSSpMu9tJQtibfxoZ4qcxph` | `$65,000` | Top-10 ~22.8% (2 clusters) | [⚡ Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=nPD9vif19C2oY1jhHRrAJSSpMu9tJQtibfxoZ4qcxph) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=nPD9vif19C2oY1jhHRrAJSSpMu9tJQtibfxoZ4qcxph) |
| **SOL** | `$BONK` | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | `$14.8M` | Verified Liquidity Locked | [⚡ Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263) |
| **SOL** | `$WIF` | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | `$31.2M` | Top-10 Decentralized | [⚡ Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm) |
| **BASE** | `$BRETT` | `0x532f27101965dd16442E59d40670FaF5eBB142E4` | `$22.4M` | Verified Contract Clean | [🔵 Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=0x532f27101965dd16442E59d40670FaF5eBB142E4) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=0x532f27101965dd16442E59d40670FaF5eBB142E4) |
| **BASE** | `$DEGEN` | `0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed` | `$9.8M` | Verified Pool State Verified | [🔵 Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed) |
| **BASE** | `$AERO` | `0x940181a94A35A4569E4529A3CDfB74e38FD98631` | `$45.1M` | Aerodrome DEX Native | [🔵 Unlock Report ($0.01)](https://rugshield-402.onrender.com/?token=0x940181a94A35A4569E4529A3CDfB74e38FD98631) · [👁️ Action](https://rugshield-402.onrender.com/api/actions/scan?token=0x940181a94A35A4569E4529A3CDfB74e38FD98631) |

---
*Generated automatically by Kurox x402 Live Traffic Magnet Engine.*
