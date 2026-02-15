import { describe, it, expect } from "vitest";
import { BUILTIN_ADAPTERS } from "../../src/adapters/index.js";
import { LawMcpShell } from "../../src/shell/shell.js";

const shell = LawMcpShell.fromAdapters(BUILTIN_ADAPTERS);

describe("LawMcpShell", () => {
  it("law.list_countries returns registered adapters", async () => {
    const result = await shell.handleToolCall({
      name: "law.list_countries",
      arguments: {},
    });

    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as unknown[]).length).toBe(2);
  });

  it("law.parse_citation parses SFS format for Sweden", async () => {
    const result = await shell.handleToolCall({
      name: "law.parse_citation",
      arguments: { country: "se", citation: "SFS 2010:800" },
    });

    expect(result.ok).toBe(true);
    expect((result.data as { normalized: string }).normalized).toBe(
      "SFS 2010:800",
    );
  });

  it("unknown country returns structured error", async () => {
    const result = await shell.handleToolCall({
      name: "law.describe_country",
      arguments: { country: "de" },
    });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("unknown_country");
  });
});
