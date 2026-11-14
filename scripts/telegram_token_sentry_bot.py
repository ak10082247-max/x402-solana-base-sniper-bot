#!/usr/bin/env python3
"""
RugShield 402 — Telegram Community Token Sentry Bot
---------------------------------------------------
A zero-cost, lightweight Telegram bot that automatically detects Solana SPL
and Base ERC-20 contract addresses in group chats, queries the live RugShield 402
pre-trade honeypot simulation API, and sends an interactive security teaser card
with a 1-click in-app Telegram Mini App web terminal for $0.01 USDC unlock.

Setup in 60 Seconds:
1. Message @BotFather on Telegram to create a free bot and get a BOT_TOKEN.
2. Run: pip install python-telegram-bot requests
3. Set your token: export TELEGRAM_BOT_TOKEN="your_token_here"
4. Run: python scripts/telegram_token_sentry_bot.py
5. Add your bot to any crypto Telegram channel or degen trading group!
"""

import os
import re
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

RUGSHIELD_URL = os.getenv("RUGSHIELD_URL", "https://rugshield-402.onrender.com")
SOLANA_CA_REGEX = re.compile(r"\b([1-9A-HJ-NP-Za-km-z]{32,44})\b")
EVM_CA_REGEX = re.compile(r"\b(0x[a-fA-F0-9]{40})\b")

def audit_token(address: str, chain: str) -> dict | None:
    try:
        res = requests.post(
            f"{RUGSHIELD_URL}/v1/scan/preview",
            json={"token_address": address, "chain": chain, "simulate_sell": True},
            timeout=8
        )
        if res.status_code == 200:
            return res.json()
        logging.warning(f"RugShield API returned HTTP {res.status_code}")
    except Exception as e:
        logging.warning(f"Error querying RugShield API: {e}")

    return None

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    text = update.message.text
    
    # Check for Solana address
    sol_match = SOLANA_CA_REGEX.search(text)
    evm_match = EVM_CA_REGEX.search(text)

    if not sol_match and not evm_match:
        return

    if sol_match:
        address = sol_match.group(1)
        chain = "solana"
        chain_label = "SOLANA MAINNET"
    else:
        address = evm_match.group(1)
        chain = "base"
        chain_label = "BASE MAINNET"

    logging.info(f"Detected token {address} on {chain_label}")

    data = audit_token(address, chain)
    if data is None:
        await update.message.reply_text(
            f"⚠️ *RugShield 402 Unavailable*\nToken `{address}` ({chain_label}) could not be verified right now. Do NOT treat this as safe.",
            parse_mode="Markdown",
        )
        return

    is_honeypot = data.get("is_honeypot")
    buy_tax_bps = data.get("buy_tax_bps")
    sell_tax_bps = data.get("sell_tax_bps")
    liquidity_usd = data.get("liquidity_usd")
    clusters = data.get("sybil_clusters")
    sim_status = data.get("simulation_status")

    buy_tax = f"{buy_tax_bps / 100:.1f}%" if isinstance(buy_tax_bps, (int, float)) else "N/A (paid /v1/scan required)"
    sell_tax = f"{sell_tax_bps / 100:.1f}%" if isinstance(sell_tax_bps, (int, float)) else "N/A (paid /v1/scan required)"
    liquidity = f"${liquidity_usd:,}" if isinstance(liquidity_usd, (int, float)) else "N/A (paid /v1/scan required)"
    clusters_label = f"{clusters} suspicious rings" if isinstance(clusters, (int, float)) else "N/A (paid /v1/scan required)"

    if is_honeypot is True:
        verdict_emoji = "🚨"
        status_text = "DANGER: HONEYPOT DETECTED"
    elif is_honeypot is False:
        verdict_emoji = "🛡️"
        status_text = "PASS (Safe & Liquidatable)"
    else:
        verdict_emoji = "⏳"
        status_text = f"UNSIMULATED PREVIEW ({sim_status or 'paid /v1/scan required'})"

    report = (
        f"{verdict_emoji} *RugShield 402 Pre-Trade Sentry*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🔍 *Token:* `{address}`\n"
        f"🌐 *Network:* `{chain_label}`\n"
        f"🚨 *Honeypot Gate:* *{status_text}*\n"
        f"💸 *Taxes:* Buy: `{buy_tax}` | Sell: `{sell_tax}`\n"
        f"💧 *Pool Depth:* `{liquidity}`\n"
        f"👥 *Dev Clusters:* `{clusters_label}`\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 _Teaser preview provided by RugShield 402. Full cryptographic cluster map & bytecode simulation available below._"
    )

    terminal_url = f"{RUGSHIELD_URL}/?token={address}"
    keyboard = [
        [
            InlineKeyboardButton(
                "⚡ Unlock Deep Audit ($0.01 USDC)",
                web_app=WebAppInfo(url=terminal_url)
            )
        ],
        [
            InlineKeyboardButton(
                "🌐 Open Web Terminal (Browser)",
                url=terminal_url
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        report,
        reply_markup=reply_markup,
        parse_mode="Markdown",
        disable_web_page_preview=True
    )

def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Error: TELEGRAM_BOT_TOKEN environment variable not set.")
        print("Example: export TELEGRAM_BOT_TOKEN='123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ'")
        return

    print("🤖 RugShield 402 Telegram Sentry Bot starting up...")
    app = ApplicationBuilder().token(token).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling()

if __name__ == "__main__":
    main()
