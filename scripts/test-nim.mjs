#!/usr/bin/env node
/**
 * scripts/test-nim.mjs
 * Run locally to verify NVIDIA NIM proxy connectivity.
 *
 * Usage: node scripts/test-nim.mjs
 * Or:    npm run test:nim
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load .env.local if present
try {
  const envPath = join(ROOT, '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
  console.log('✓ Loaded .env.local');
} catch {
  console.log('  No .env.local found — using system env');
}

const BASE_URL =
  process.env.NVIDIA_NIM_BASE_URL ??
  process.env.NVIDIA_NIM_PROXY_BASE_URL ??
  'http://31.220.58.212:8082';

const API_KEY =
  process.env.NVIDIA_NIM_API_KEY ??
  process.env.NVIDIA_NIM_PROXY_API_KEY ??
  'dummy';

const MODEL =
  process.env.NVIDIA_NIM_MODEL ??
  process.env.NVIDIA_NIM_PROXY_MODEL ??
  'moonshotai/kimi-k2-thinking';

console.log(`\n── NVIDIA NIM Proxy Test ──`);
console.log(`  Base URL : ${BASE_URL}`);
console.log(`  API Key  : ${API_KEY}`);
console.log(`  Model    : ${MODEL}\n`);

// ── Step 1: Connectivity check ────────────────────────────────────────────────

process.stdout.write('[1/3] Connectivity check ... ');
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 15000);

try {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: 'Reply with only the word CONNECTED' }],
      max_tokens: 10,
    }),
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) {
    const text = await res.text();
    console.log(`FAIL (HTTP ${res.status}): ${text.slice(0, 200)}`);
    process.exit(1);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? '';
  if (reply.includes('CONNECTED')) {
    console.log(`PASS  →  "${reply.trim()}"`);
  } else {
    console.log(`WARN — unexpected reply: "${reply.trim()}" (but proxy responded)`);
  }
} catch (err) {
  clearTimeout(timer);
  if (err.name === 'AbortError') {
    console.log(`FAIL — timed out after 15s`);
  } else {
    console.log(`FAIL — ${err.message}`);
  }
  console.log('\n  ⚠  The proxy is unreachable from this machine.');
  console.log('     Make sure you are on the same network as 31.220.58.212.');
  process.exit(1);
}

// ── Step 2: Real prompt test ───────────────────────────────────────────────────

process.stdout.write('[2/3] Prompt test ... ');
try {
  const res2 = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: 'Reply with only the word WORKING' }],
      max_tokens: 10,
    }),
  });

  const data2 = await res2.json();
  const reply2 = data2?.choices?.[0]?.message?.content ?? '';
  if (reply2.includes('WORKING')) {
    console.log(`PASS  →  "${reply2.trim()}"`);
  } else {
    console.log(`WARN — reply: "${reply2.trim()}"`);
  }
} catch (err) {
  console.log(`FAIL — ${err.message}`);
}

// ── Step 3: JSON output test (compile-prompt style) ────────────────────────────

process.stdout.write('[3/3] JSON output test ... ');
try {
  const res3 = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Respond with only valid JSON. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: 'Return exactly: {"status": "ok", "test": "passed"}',
        },
      ],
      max_tokens: 30,
    }),
  });

  const data3 = await res3.json();
  const raw = data3?.choices?.[0]?.message?.content ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    console.log(`PASS  →  ${JSON.stringify(parsed)}`);
  } else {
    console.log(`WARN — non-JSON reply: "${raw.slice(0, 80)}"`);
  }
} catch (err) {
  console.log(`FAIL — ${err.message}`);
}

console.log('\n── Test complete ──\n');
console.log('Next: npm run dev  →  curl http://localhost:3000/api/nim/health');
