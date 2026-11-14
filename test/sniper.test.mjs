import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import http from "node:http";
import bs58 from "bs58";
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
    assert.equal(SERVICE_VERSION, "1.1.1");
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

function generateEphemeralSolanaKeyBase58() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const x = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url");
  const d = Buffer.from(privateKey.export({ format: "jwk" }).d, "base64url");
  return bs58.encode(Buffer.concat([d, x]));
}

async function withMockSolanaRpc(fn) {
  const mintData = Buffer.alloc(82, 0);
  mintData.writeUInt32LE(1, 0);
  mintData[44] = 6;
  mintData[45] = 1;
  const mintB64 = mintData.toString("base64");

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const parsed = JSON.parse(body);
      const reply = (msg) => {
        if (msg.method === "getAccountInfo") {
          return {
            jsonrpc: "2.0",
            id: msg.id,
            result: {
              context: { slot: 300000000 },
              value: {
                data: [mintB64, "base64"],
                executable: false,
                lamports: 1000000000,
                owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                rentEpoch: 0,
                space: 82,
              },
            },
          };
        }
        if (msg.method === "getLatestBlockhash") {
          return {
            jsonrpc: "2.0",
            id: msg.id,
            result: {
              context: { slot: 300000000 },
              value: {
                blockhash: "11111111111111111111111111111111",
                lastValidBlockHeight: 300000150,
              },
            },
          };
        }
        return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Unsupported: ${msg.method}` } };
      };
      const out = Array.isArray(parsed) ? parsed.map(reply) : reply(parsed);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function buildSolanaPaymentRequiredHeader(url, payTo = "9wuMysgXwNhtQeqJgGByAiMYc4EjzZ5wUSmnjrrt3ffh") {
  return Buffer.from(
    JSON.stringify({
      x402Version: 2,
      error: "Payment Required",
      resource: { url, description: "Solana x402", mimeType: "application/json" },
      accepts: [
        {
          scheme: "exact",
          network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          amount: "10000",
          asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          payTo,
          maxTimeoutSeconds: 300,
          extra: {
            name: "USD Coin (Solana)",
            version: "2",
            feePayer: "CjNFTjvBhbJJd2B5ePPMHRLx1ELZpa8dwQgGL727eKww",
          },
        },
      ],
    }),
    "utf8",
  ).toString("base64");
}

test("verifyTokenBeforeSnipe and executeMcpToolCall sign live Solana USDC x402 payments via @x402/svm", async () => {
  const solanaPrivateKey = generateEphemeralSolanaKeyBase58();
  const seenSolSigs = [];
  await withMockSolanaRpc(async (rpcUrl) => {
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
            "payment-required": buildSolanaPaymentRequiredHeader(url),
          },
        });
      }
      seenSolSigs.push({ url, decoded: JSON.parse(Buffer.from(sig, "base64").toString("utf8")) });
      return new Response(
        JSON.stringify({
          is_honeypot: false,
          buy_tax_bps: 0,
          sell_tax_bps: 0,
          liquidity_usd: 1500000,
          recommendation: "SAFE_TO_SWAP",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const snipe = await verifyTokenBeforeSnipe("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "solana", {
      solanaPrivateKey,
      solanaRpcUrl: rpcUrl,
      customFetch,
    });
    assert.equal(snipe.safeToExecute, true);
    assert.equal(snipe.paymentMode, "x402_paid");

    const mcp = await executeMcpToolCall(
      "smart_money_netflow_tracker",
      { token_address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", chain: "solana" },
      { solanaPrivateKey, solanaRpcUrl: rpcUrl, customFetch },
    );
    assert.equal(mcp.isError, false);
    assert.equal(seenSolSigs.length, 2);
    assert.equal(seenSolSigs[0].decoded.accepted.network, "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp");
    assert.ok(seenSolSigs[0].decoded.payload.transaction.length > 40);
  });
});

test("executeMcpToolCall rejects unauthorized Solana merchant payTo in 402 challenge", async () => {
  const solanaPrivateKey = generateEphemeralSolanaKeyBase58();
  await withMockSolanaRpc(async (rpcUrl) => {
    await assert.rejects(
      () =>
        executeMcpToolCall(
          "smart_money_netflow_tracker",
          { token_address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", chain: "solana" },
          {
            solanaPrivateKey,
            solanaRpcUrl: rpcUrl,
            customFetch: async (input) => {
              const url = input instanceof Request ? input.url : String(input);
              return new Response(JSON.stringify({ error: "Payment Required" }), {
                status: 402,
                headers: {
                  "content-type": "application/json",
                  "payment-required": buildSolanaPaymentRequiredHeader(url, "11111111111111111111111111111111"),
                },
              });
            },
          },
        ),
      /Rejected unauthorized Solana merchant payTo/,
    );
  });
});
