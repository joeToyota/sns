"use strict";

const fetch = require("node-fetch");
const https = require("https");
const crypto = require("crypto");

require("dotenv").config();

const BASE_URL = "https://fb.xn--12clh6dc4eub3cdb2qwc.com";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mytoken";
const APP_SECRET = process.env.APP_SECRET || "";

// Bypass SSL cert mismatch for non-SSL tests (dev only)
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function signPayload(body) {
  return "sha1=" + crypto.createHmac("sha1", APP_SECRET).update(body).digest("hex");
}

// ─── SSL Certificate ─────────────────────────────────────────────────────────

async function testSSL() {
  console.log("\nSSL Certificate");

  await test("certificate matches domain (required by Facebook)", async () => {
    const challenge = "ssl_test_" + Date.now();
    const url =
      `${BASE_URL}/webhook` +
      `?hub.mode=subscribe` +
      `&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}` +
      `&hub.challenge=${challenge}`;
    // No insecureAgent — must pass real SSL validation
    const res = await fetch(url);
    assert(res.status === 200, `SSL cert invalid or domain mismatch`);
  });
}

// ─── GET /webhook ─────────────────────────────────────────────────────────────

async function testWebhookVerification() {
  console.log("\nGET /webhook — Verification");

  await test("correct token returns challenge", async () => {
    const challenge = "test_challenge_" + Date.now();
    const url =
      `${BASE_URL}/webhook` +
      `?hub.mode=subscribe` +
      `&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}` +
      `&hub.challenge=${challenge}`;
    const res = await fetch(url, { agent: insecureAgent });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const body = await res.text();
    assert(body === challenge, `expected "${challenge}", got "${body}"`);
  });

  await test("wrong token returns 403", async () => {
    const url =
      `${BASE_URL}/webhook` +
      `?hub.mode=subscribe` +
      `&hub.verify_token=wrong_token` +
      `&hub.challenge=ignored`;
    const res = await fetch(url, { agent: insecureAgent });
    assert(res.status === 403, `expected 403, got ${res.status}`);
  });

  await test("wrong mode returns 403", async () => {
    const url =
      `${BASE_URL}/webhook` +
      `?hub.mode=unsubscribe` +
      `&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}` +
      `&hub.challenge=ignored`;
    const res = await fetch(url, { agent: insecureAgent });
    assert(res.status === 403, `expected 403, got ${res.status}`);
  });
}

// ─── POST /webhook ────────────────────────────────────────────────────────────

async function testWebhookEvents() {
  console.log("\nPOST /webhook — Events");

  await test("valid page event returns 200 EVENT_RECEIVED", async () => {
    const payload = JSON.stringify({
      object: "page",
      entry: [
        {
          id: "PAGE_ID",
          time: Date.now(),
          messaging: [
            {
              sender: { id: "USER_PSID" },
              recipient: { id: "PAGE_ID" },
              timestamp: Date.now(),
              message: { mid: "mid.test", text: "hello" }
            }
          ]
        }
      ]
    });
    const res = await fetch(`${BASE_URL}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature": signPayload(payload)
      },
      body: payload,
      agent: insecureAgent
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text === "EVENT_RECEIVED", `expected "EVENT_RECEIVED", got "${text}"`);
  });

  await test("non-page object returns 404", async () => {
    const payload = JSON.stringify({ object: "user", entry: [] });
    const res = await fetch(`${BASE_URL}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature": signPayload(payload)
      },
      body: payload,
      agent: insecureAgent
    });
    assert(res.status === 404, `expected 404, got ${res.status}`);
  });

  await test("missing signature is rejected (4xx/5xx)", async () => {
    const payload = JSON.stringify({ object: "page", entry: [] });
    const res = await fetch(`${BASE_URL}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      agent: insecureAgent
    });
    assert(res.status >= 400, `expected error status, got ${res.status}`);
  });
}

// ─── GET /health ──────────────────────────────────────────────────────────────

async function testHealth() {
  console.log("\nGET /health");

  await test("returns 200 with status ok", async () => {
    const res = await fetch(`${BASE_URL}/health`, { agent: insecureAgent });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.status === "ok", `expected status "ok", got "${json.status}"\n    ${JSON.stringify(json.checks, null, 2)}`);
  });

  await test("all env vars are set", async () => {
    const res = await fetch(`${BASE_URL}/health`, { agent: insecureAgent });
    const json = await res.json();
    const missing = Object.entries(json.checks.env)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    assert(missing.length === 0, `missing env vars: ${missing.join(", ")}`);
  });

  await test("webhook url uses HTTPS", async () => {
    const res = await fetch(`${BASE_URL}/health`, { agent: insecureAgent });
    const json = await res.json();
    assert(
      json.checks.webhook.url_is_https,
      `webhook URL is not HTTPS: ${json.checks.webhook.url}`
    );
  });
}

// ─── Run all ──────────────────────────────────────────────────────────────────

(async () => {
  console.log(`Testing: ${BASE_URL}`);
  console.log("─".repeat(50));
  console.log("⚠  Non-SSL tests bypass cert validation (dev/staging only)\n");

  await testSSL();
  await testWebhookVerification();
  await testWebhookEvents();
  await testHealth();

  console.log("\n" + "─".repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\n🔴 Not ready for Facebook — fix failing tests first.");
  } else {
    console.log("\n🟢 All tests passed — ready to connect to Facebook.");
  }

  if (failed > 0) process.exit(1);
})();
