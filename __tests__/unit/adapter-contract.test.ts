import { describe, it, expect } from "vitest";
import { BUILTIN_ADAPTERS } from "../../src/adapters/index.js";

describe("adapter capability flags match implemented handlers", () => {
  for (const adapter of BUILTIN_ADAPTERS) {
    describe(`adapter: ${adapter.country.code}`, () => {
      if (adapter.capabilities.documents) {
        it("has searchDocuments function", () => {
          expect(typeof adapter.searchDocuments).toBe("function");
        });

        it("has getDocument function", () => {
          expect(typeof adapter.getDocument).toBe("function");
        });
      }

      if (adapter.capabilities.citations) {
        it("has parseCitation function", () => {
          expect(typeof adapter.parseCitation).toBe("function");
        });

        it("has validateCitation function", () => {
          expect(typeof adapter.validateCitation).toBe("function");
        });
      }

      if (adapter.capabilities.ingestion) {
        it("has runIngestion function", () => {
          expect(typeof adapter.runIngestion).toBe("function");
        });
      }
    });
  }
});
