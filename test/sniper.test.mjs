import test from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_VERSION,
  verifyTokenBeforeSnipe,
  executeMcpToolCall,
} from "../dist/index.js";

const TEST_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const BASE_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

function buildPaymentRequiredHeader(url) {
  return Buffer.from(
    JSON.stringify({
      x402Version: 2,
      error: "Payment Required",
      resource: { url, description: "Sniper scan", mimeType: "application/json" },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          amount: "10000",
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          payTo: "0x80E0Ae84679b7f11bE171DaADd492FBECf628cd6",
          maxTimeoutSeconds: 300,
          extra: { name: "USD Coin", version: "2" },
        },
      ],
    }),
    "utf8"
  ).toString("base64");
}

test("verifyTokenBeforeSnipe uses free preview and returns upgradeHint when no privateKey", async () => {
  const prevKey = process.env.X402_PRIVATE_KEY;
  delete process.env.X402_PRIVATE_KEY;
  const seenUrls = [];
  try {
    const res = await verifyTokenBeforeSnipe(BASE_TOKEN, "base", {
      customFetch: async (input) => {
        const url = input instanceof Request ? input.url : String(input);
        seenUrls.push(url);
        return new Response(
          JSON.stringify({
            is_honeypot: false,
            risk_score: 5,
            buy_tax_bps: 0,
            sell_tax_bps: 0,
            verdict: "SAFE_PREVIEW",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      },
    });
    assert.equal(SERVICE_VERSION, "1.0.11");
    assert.equal(seenUrls.length, 1);
    assert.match(seenUrls[0], /\/v1\/scan\/preview$/);
    assert.equal(res.paymentMode, "free_preview");
    assert.ok(res.upgradeHint && res.upgradeHint.includes("X402_PRIVATE_KEY"));
  } finally {
    if (prevKey !== undefined) process.env.X402_PRIVATE_KEY = prevKey;
  }
});

test("verifyTokenBeforeSnipe and executeMcpToolCall sign live x402 payments when privateKey is set", async () => {
  const seenSigHeaders = [];
  const customFetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const sig =
      (input instanceof Request ? input.headers.get("payment-signature") : null) ??
      (init?.headers instanceof Headers ? init.headers.get("payment-signature") : null);
    if (!sig) {
      return new Response(JSON.stringify({ error: "Payment Required" }), {
        status: 402,
        headers: {
          "content-type": "application/json",
          "payment-required": buildPaymentRequiredHeader(url),
        },
      });
    }
    seenSigHeaders.push({ url, sig });
    return new Response(
      JSON.stringify({
        is_honeypot: false,
        buy_tax_bps: 0,
        sell_tax_bps: 0,
        risk_score: 10,
        netflow_24h_usd: 125000,
        sybil_cluster_detected: false,
        verdict: "SAFE_TO_SNIPE",
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const snipe = await verifyTokenBeforeSnipe(BASE_TOKEN, "base", {
    privateKey: TEST_PRIVATE_KEY,
    customFetch,
  });
  assert.equal(snipe.safeToExecute, true);
  assert.equal(snipe.paymentMode, "x402_paid");

  const mcpRes = await executeMcpToolCall(
    "smart_money_netflow_tracker",
    { token_address: BASE_TOKEN, chain: "base" },
    { privateKey: TEST_PRIVATE_KEY, customFetch }
  );
  assert.equal(mcpRes.isError, false);
  assert.equal(seenSigHeaders.length, 2);
  assert.match(seenSigHeaders[0].url, /\/v1\/scan$/);
  assert.match(seenSigHeaders[1].url, /\/api\/v1\/smart-money\/netflow\?/);
});
