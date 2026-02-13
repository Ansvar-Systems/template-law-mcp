import assert from "node:assert/strict";
import test from "node:test";
import { BUILTIN_ADAPTERS } from "../src/adapters/index.js";

test("adapter capability flags match implemented handlers", () => {
  for (const adapter of BUILTIN_ADAPTERS) {
    if (adapter.capabilities.documents) {
      assert.equal(typeof adapter.searchDocuments, "function");
      assert.equal(typeof adapter.getDocument, "function");
    }

    if (adapter.capabilities.citations) {
      assert.equal(typeof adapter.parseCitation, "function");
      assert.equal(typeof adapter.validateCitation, "function");
    }

    if (adapter.capabilities.ingestion) {
      assert.equal(typeof adapter.runIngestion, "function");
    }
  }
});
