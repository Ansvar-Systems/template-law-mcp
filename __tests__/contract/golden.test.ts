import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LawMcpShell } from "../../src/shell/shell.js";
import { BUILTIN_ADAPTERS } from "../../src/adapters/index.js";
import type { ToolName, ToolResult } from "../../src/shell/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

interface GoldenTestAssertions {
  result_not_empty?: boolean;
  text_contains?: string[];
  any_result_contains?: string[];
  fields_present?: string[];
  text_not_empty?: boolean;
  min_results?: number;
  citation_url_pattern?: string;
  upstream_text_hash?: { url: string; expected_sha256: string };
  citation_resolves?: boolean;
  handles_gracefully?: boolean;
}

interface GoldenTest {
  id: string;
  category: string;
  description: string;
  tool: ToolName;
  input: Record<string, unknown>;
  assertions: GoldenTestAssertions;
}

interface GoldenTestsFile {
  $schema?: string;
  version: string;
  mcp_name: string;
  description: string;
  tests: GoldenTest[];
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

function extractCitationUrls(data: unknown): string[] {
  const urls: string[] = [];
  const text = JSON.stringify(data);
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  return urls;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractResultList(result: ToolResult): unknown[] {
  if (!result.ok || result.data === undefined) return [];
  if (Array.isArray(result.data)) return result.data;
  const dataObj = result.data as Record<string, unknown>;
  if (Array.isArray(dataObj?.documents)) return dataObj.documents;
  return [];
}

function stringifyData(data: unknown): string {
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 0) ?? "";
}

// ---------------------------------------------------------------------------
// Load fixtures & create shell
// ---------------------------------------------------------------------------

const fixturesPath = join(__dirname, "..", "..", "fixtures", "golden-tests.json");
const fixtureContent = readFileSync(fixturesPath, "utf-8");
const fixture: GoldenTestsFile = JSON.parse(fixtureContent);

const shell = LawMcpShell.fromAdapters(BUILTIN_ADAPTERS);

const isNightly = process.env["CONTRACT_MODE"] === "nightly";

// ---------------------------------------------------------------------------
// Contract test runner
// ---------------------------------------------------------------------------

describe(`Contract tests: ${fixture.mcp_name}`, () => {
  for (const test of fixture.tests) {
    describe(`[${test.id}] ${test.description}`, () => {
      let result: ToolResult;

      // Execute the tool call once per test group
      it("runs without throwing", async () => {
        result = await shell.handleToolCall({
          name: test.tool,
          arguments: test.input,
        });
        // The shell should always return a ToolResult, never throw
        expect(result).toBeDefined();
        expect(result.tool).toBe(test.tool);
      });

      // ---------------------------------------------------------------
      // result_not_empty
      // ---------------------------------------------------------------
      if (test.assertions.result_not_empty) {
        it("result is not empty", async () => {
          result ??= await shell.handleToolCall({
            name: test.tool,
            arguments: test.input,
          });

          // A non-empty response means either ok with data, or error with structured error
          if (result.ok) {
            expect(result.data).toBeDefined();
          } else {
            expect(result.error).toBeDefined();
          }
        });
      }

      // ---------------------------------------------------------------
      // text_contains
      // ---------------------------------------------------------------
      if (test.assertions.text_contains) {
        for (const needle of test.assertions.text_contains) {
          it(`result contains text "${needle}"`, async () => {
            result ??= await shell.handleToolCall({
              name: test.tool,
              arguments: test.input,
            });

            const haystack = stringifyData(result.data).toLowerCase();
            expect(haystack).toContain(needle.toLowerCase());
          });
        }
      }

      // ---------------------------------------------------------------
      // any_result_contains
      // ---------------------------------------------------------------
      if (test.assertions.any_result_contains) {
        for (const needle of test.assertions.any_result_contains) {
          it(`any result item contains "${needle}"`, async () => {
            result ??= await shell.handleToolCall({
              name: test.tool,
              arguments: test.input,
            });

            const haystack = stringifyData(result.data).toLowerCase();
            expect(haystack).toContain(needle.toLowerCase());
          });
        }
      }

      // ---------------------------------------------------------------
      // fields_present
      // ---------------------------------------------------------------
      if (test.assertions.fields_present) {
        it(`result has fields: ${test.assertions.fields_present.join(", ")}`, async () => {
          result ??= await shell.handleToolCall({
            name: test.tool,
            arguments: test.input,
          });

          expect(result.ok).toBe(true);
          const data = result.data as Record<string, unknown>;
          expect(data).toBeDefined();
          for (const field of test.assertions.fields_present!) {
            expect(data).toHaveProperty(field);
          }
        });
      }

      // ---------------------------------------------------------------
      // text_not_empty
      // ---------------------------------------------------------------
      if (test.assertions.text_not_empty) {
        it("result text is not empty", async () => {
          result ??= await shell.handleToolCall({
            name: test.tool,
            arguments: test.input,
          });

          const text = stringifyData(result.data);
          expect(text.trim().length).toBeGreaterThan(0);
        });
      }

      // ---------------------------------------------------------------
      // min_results
      // ---------------------------------------------------------------
      if (test.assertions.min_results !== undefined) {
        it(`returns at least ${test.assertions.min_results} results`, async () => {
          result ??= await shell.handleToolCall({
            name: test.tool,
            arguments: test.input,
          });

          const items = extractResultList(result);
          expect(items.length).toBeGreaterThanOrEqual(
            test.assertions.min_results!,
          );
        });
      }

      // ---------------------------------------------------------------
      // citation_url_pattern
      // ---------------------------------------------------------------
      if (test.assertions.citation_url_pattern) {
        it(`citation URLs match pattern: ${test.assertions.citation_url_pattern}`, async () => {
          result ??= await shell.handleToolCall({
            name: test.tool,
            arguments: test.input,
          });

          const urls = extractCitationUrls(result.data);
          const pattern = new RegExp(test.assertions.citation_url_pattern!);
          expect(urls.length).toBeGreaterThan(0);
          for (const url of urls) {
            expect(url).toMatch(pattern);
          }
        });
      }

      // ---------------------------------------------------------------
      // upstream_text_hash
      // ---------------------------------------------------------------
      if (test.assertions.upstream_text_hash) {
        const hashAssertion = test.assertions.upstream_text_hash;
        it.skipIf(!isNightly)(
          `upstream text hash matches for ${hashAssertion.url}`,
          async () => {
            const response = await fetchWithTimeout(hashAssertion.url);
            expect(response.ok).toBe(true);
            const body = await response.text();
            const hash = sha256(body);
            expect(hash).toBe(hashAssertion.expected_sha256);
          },
          30_000,
        );
      }

      // ---------------------------------------------------------------
      // citation_resolves
      // ---------------------------------------------------------------
      if (test.assertions.citation_resolves) {
        it.skipIf(!isNightly)(
          "citation URLs resolve (HTTP 200)",
          async () => {
            result ??= await shell.handleToolCall({
              name: test.tool,
              arguments: test.input,
            });

            const urls = extractCitationUrls(result.data);
            expect(urls.length).toBeGreaterThan(0);

            for (const url of urls) {
              const response = await fetchWithTimeout(url);
              expect(
                response.ok,
                `Expected HTTP 200 for ${url}, got ${response.status}`,
              ).toBe(true);
            }
          },
          60_000,
        );
      }

      // ---------------------------------------------------------------
      // handles_gracefully
      // ---------------------------------------------------------------
      if (test.assertions.handles_gracefully) {
        it("handles gracefully (no unhandled exception)", async () => {
          result ??= await shell.handleToolCall({
            name: test.tool,
            arguments: test.input,
          });

          // The shell should return a structured response, never throw.
          // Either ok=true with data, or ok=false with a structured error.
          if (result.ok) {
            // ok=true is valid - the call may succeed in some edge cases
            expect(result.tool).toBe(test.tool);
          } else {
            expect(result.error).toBeDefined();
            expect(typeof result.error!.code).toBe("string");
            expect(typeof result.error!.message).toBe("string");
          }
        });
      }
    });
  }
});
