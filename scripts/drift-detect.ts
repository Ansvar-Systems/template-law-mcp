#!/usr/bin/env tsx
/**
 * Drift Detection Script
 *
 * Reads fixtures/golden-hashes.json, fetches each upstream URL,
 * normalizes text, computes SHA-256, and compares against expected hashes.
 *
 * Exit codes:
 *   0 - All provisions match
 *   2 - One or more provisions have drifted
 *   1 - Script error (e.g., cannot read fixtures, network failure)
 *
 * Usage:
 *   npx tsx scripts/drift-detect.ts
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoldenHash {
  id: string;
  description: string;
  upstream_url: string;
  selector_hint?: string;
  expected_sha256: string;
  expected_snippet?: string;
}

interface GoldenHashesFile {
  $schema?: string;
  version: string;
  mcp_name: string;
  jurisdiction: string;
  description: string;
  provisions: GoldenHash[];
}

interface DriftResult {
  id: string;
  upstream_url: string;
  expected_sha256: string;
  actual_sha256: string;
  drifted: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .toLowerCase();
}

function sha256(text: string): string {
  return createHash("sha256").update(normalizeText(text)).digest("hex");
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const hashesPath = join(__dirname, "..", "fixtures", "golden-hashes.json");
  let hashesFile: GoldenHashesFile;

  try {
    const content = readFileSync(hashesPath, "utf-8");
    hashesFile = JSON.parse(content);
  } catch (err) {
    console.error(
      JSON.stringify({
        status: "error",
        message: `Failed to read ${hashesPath}: ${String(err)}`,
      }),
    );
    process.exit(1);
  }

  const provisions = hashesFile.provisions;

  if (provisions.length === 0) {
    console.log(
      JSON.stringify({
        status: "skip",
        message: "No provisions to check (template placeholder hashes).",
        checked: 0,
        drifted: 0,
      }),
    );
    process.exit(0);
  }

  // Skip if all hashes are placeholder values
  const allPlaceholders = provisions.every(
    (p) =>
      p.expected_sha256.startsWith("REPLACE") ||
      p.expected_sha256.startsWith("PLACEHOLDER"),
  );

  if (allPlaceholders) {
    console.log(
      JSON.stringify({
        status: "skip",
        message:
          "All hashes are placeholders. Run initial hash generation first.",
        checked: 0,
        drifted: 0,
      }),
    );
    process.exit(0);
  }

  const results: DriftResult[] = [];
  const failures: DriftResult[] = [];

  for (let i = 0; i < provisions.length; i++) {
    const provision = provisions[i]!;

    // Rate limiting: 1 second delay between fetches
    if (i > 0) {
      await sleep(1_000);
    }

    let actualHash = "";
    let error: string | undefined;

    try {
      const response = await fetchWithTimeout(provision.upstream_url);

      if (!response.ok) {
        error = `HTTP ${response.status} ${response.statusText}`;
        actualHash = "FETCH_FAILED";
      } else {
        const body = await response.text();
        actualHash = sha256(body);
      }
    } catch (err) {
      error = `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
      actualHash = "FETCH_FAILED";
    }

    const drifted =
      actualHash !== provision.expected_sha256 &&
      actualHash !== "FETCH_FAILED";

    const result: DriftResult = {
      id: provision.id,
      upstream_url: provision.upstream_url,
      expected_sha256: provision.expected_sha256,
      actual_sha256: actualHash,
      drifted,
    };

    if (error) {
      result.error = error;
    }

    results.push(result);

    if (drifted) {
      failures.push(result);
    }
  }

  if (failures.length > 0) {
    console.log(
      JSON.stringify(
        {
          status: "drift_detected",
          message: `${failures.length} of ${results.length} provisions have drifted.`,
          checked: results.length,
          drifted: failures.length,
          failures,
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        message: `All ${results.length} provisions match expected hashes.`,
        checked: results.length,
        drifted: 0,
        results,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      status: "error",
      message: `Unhandled error: ${String(err)}`,
    }),
  );
  process.exit(1);
});
