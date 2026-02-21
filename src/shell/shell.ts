import { AdapterRegistry } from "./adapter-registry.js";
import { ShellError, toShellError } from "./errors.js";
import { TOOL_DEFINITIONS } from "./tool-contract.js";
import type {
  CountryAdapter,
  IngestionRequest,
  ProvisionDiff,
  ProvisionHistory,
  RecentChangesResponse,
  SearchRequest,
  ToolCall,
  ToolDefinition,
  ToolName,
  ToolResult,
} from "./types.js";

const PREMIUM_UPGRADE_MESSAGE =
  "Version tracking is available in the Ansvar Intelligence Portal. Contact hello@ansvar.ai for access.";

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export class LawMcpShell {
  private readonly handlers: Record<ToolName, ToolHandler>;

  constructor(private readonly registry: AdapterRegistry) {
    this.handlers = {
      "law.list_countries": this.listCountries.bind(this),
      "law.describe_country": this.describeCountry.bind(this),
      "law.search_documents": this.searchDocuments.bind(this),
      "law.get_document": this.getDocument.bind(this),
      "law.parse_citation": this.parseCitation.bind(this),
      "law.validate_citation": this.validateCitation.bind(this),
      "law.run_ingestion": this.runIngestion.bind(this),
      // Premium tools
      "law.get_provision_history": this.getProvisionHistory.bind(this),
      "law.diff_provision": this.diffProvision.bind(this),
      "law.get_recent_changes": this.getRecentChanges.bind(this),
    };
  }

  static fromAdapters(adapters: CountryAdapter[]): LawMcpShell {
    const registry = new AdapterRegistry();
    registry.registerMany(adapters);
    return new LawMcpShell(registry);
  }

  getToolDefinitions(): ToolDefinition[] {
    return TOOL_DEFINITIONS;
  }

  async handleToolCall(call: ToolCall): Promise<ToolResult> {
    const args = call.arguments ?? {};

    try {
      const handler = this.handlers[call.name];
      const data = await handler(args);

      return {
        tool: call.name,
        ok: true,
        data,
      };
    } catch (error) {
      const normalizedError = toShellError(error);
      return {
        tool: call.name,
        ok: false,
        error: {
          code: normalizedError.code,
          message: normalizedError.message,
          details: normalizedError.details,
        },
      };
    }
  }

  private async listCountries(): Promise<unknown> {
    return this.registry.list().map((adapter) => ({
      country: adapter.country,
      capabilities: adapter.capabilities,
    }));
  }

  private async describeCountry(args: Record<string, unknown>): Promise<unknown> {
    const countryCode = requireString(args, "country");
    const adapter = this.registry.get(countryCode);

    return {
      country: adapter.country,
      capabilities: adapter.capabilities,
      tools: this.countryToolSupport(adapter),
    };
  }

  private async searchDocuments(args: Record<string, unknown>): Promise<unknown> {
    const adapter = this.requireDocumentsAdapter(args);
    const query = requireString(args, "query");
    const limit = optionalNumber(args, "limit");
    const request: SearchRequest =
      limit === undefined ? { query } : { query, limit };

    return adapter.searchDocuments!(request);
  }

  private async getDocument(args: Record<string, unknown>): Promise<unknown> {
    const adapter = this.requireDocumentsAdapter(args);
    const id = requireString(args, "id");

    return adapter.getDocument!(id);
  }

  private async parseCitation(args: Record<string, unknown>): Promise<unknown> {
    const adapter = this.requireCitationsAdapter(args);
    const citation = requireString(args, "citation");

    return adapter.parseCitation!(citation);
  }

  private async validateCitation(
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const adapter = this.requireCitationsAdapter(args);
    const citation = requireString(args, "citation");

    return adapter.validateCitation!(citation);
  }

  private async runIngestion(args: Record<string, unknown>): Promise<unknown> {
    const adapter = this.requireIngestionAdapter(args);
    const sourceId = optionalString(args, "sourceId");
    const dryRun = optionalBoolean(args, "dryRun") ?? false;
    const request: IngestionRequest =
      sourceId === undefined ? { dryRun } : { sourceId, dryRun };

    return adapter.runIngestion!(request);
  }

  private requireDocumentsAdapter(args: Record<string, unknown>): CountryAdapter {
    const adapter = this.requireCountry(args);

    if (!adapter.capabilities.documents || !adapter.searchDocuments || !adapter.getDocument) {
      throw new ShellError(
        "unsupported_capability",
        `Country ${adapter.country.code} does not support document search`,
      );
    }

    return adapter;
  }

  private requireCitationsAdapter(args: Record<string, unknown>): CountryAdapter {
    const adapter = this.requireCountry(args);

    if (
      !adapter.capabilities.citations ||
      !adapter.parseCitation ||
      !adapter.validateCitation
    ) {
      throw new ShellError(
        "unsupported_capability",
        `Country ${adapter.country.code} does not support citation parsing`,
      );
    }

    return adapter;
  }

  private requireIngestionAdapter(args: Record<string, unknown>): CountryAdapter {
    const adapter = this.requireCountry(args);

    if (!adapter.capabilities.ingestion || !adapter.runIngestion) {
      throw new ShellError(
        "unsupported_capability",
        `Country ${adapter.country.code} does not support ingestion`,
      );
    }

    return adapter;
  }

  private requireCountry(args: Record<string, unknown>): CountryAdapter {
    const countryCode = requireString(args, "country");
    return this.registry.get(countryCode);
  }

  // --- Premium tool handlers ---

  private async getProvisionHistory(args: Record<string, unknown>): Promise<unknown> {
    if (!process.env.PREMIUM_ENABLED) {
      return { premium: false, message: PREMIUM_UPGRADE_MESSAGE };
    }
    const adapter = this.requireVersionTrackingAdapter(args);
    const lawIdentifier = requireString(args, "law_identifier");
    const article = requireString(args, "article");
    return adapter.getProvisionHistory!(lawIdentifier, article);
  }

  private async diffProvision(args: Record<string, unknown>): Promise<unknown> {
    if (!process.env.PREMIUM_ENABLED) {
      return { premium: false, message: PREMIUM_UPGRADE_MESSAGE };
    }
    const adapter = this.requireVersionTrackingAdapter(args);
    const lawIdentifier = requireString(args, "law_identifier");
    const article = requireString(args, "article");
    const fromDate = requireString(args, "from_date");
    const toDate = optionalString(args, "to_date");
    return adapter.diffProvision!(lawIdentifier, article, fromDate, toDate);
  }

  private async getRecentChanges(args: Record<string, unknown>): Promise<unknown> {
    if (!process.env.PREMIUM_ENABLED) {
      return { premium: false, message: PREMIUM_UPGRADE_MESSAGE };
    }
    const adapter = this.requireVersionTrackingAdapter(args);
    const since = requireString(args, "since");
    const limit = optionalNumber(args, "limit");
    return adapter.getRecentChanges!(since, limit);
  }

  private requireVersionTrackingAdapter(args: Record<string, unknown>): CountryAdapter {
    const adapter = this.requireCountry(args);

    if (
      !adapter.capabilities.version_tracking ||
      !adapter.getProvisionHistory ||
      !adapter.diffProvision ||
      !adapter.getRecentChanges
    ) {
      throw new ShellError(
        "unsupported_capability",
        `Country ${adapter.country.code} does not support version tracking`,
      );
    }

    return adapter;
  }

  private countryToolSupport(adapter: CountryAdapter): Record<string, boolean> {
    return {
      "law.search_documents":
        adapter.capabilities.documents &&
        Boolean(adapter.searchDocuments) &&
        Boolean(adapter.getDocument),
      "law.parse_citation":
        adapter.capabilities.citations &&
        Boolean(adapter.parseCitation) &&
        Boolean(adapter.validateCitation),
      "law.run_ingestion":
        adapter.capabilities.ingestion && Boolean(adapter.runIngestion),
      "law.get_provision_history":
        adapter.capabilities.version_tracking &&
        Boolean(adapter.getProvisionHistory),
      "law.diff_provision":
        adapter.capabilities.version_tracking &&
        adapter.capabilities.change_diffs &&
        Boolean(adapter.diffProvision),
      "law.get_recent_changes":
        adapter.capabilities.version_tracking &&
        Boolean(adapter.getRecentChanges),
    };
  }
}

function requireString(
  args: Record<string, unknown>,
  key: string,
): string {
  const value = args[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ShellError("invalid_arguments", `Expected non-empty string: ${key}`);
  }

  return value;
}

function optionalString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ShellError("invalid_arguments", `Expected string: ${key}`);
  }

  return value;
}

function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = args[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ShellError("invalid_arguments", `Expected number: ${key}`);
  }

  return value;
}

function optionalBoolean(
  args: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = args[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ShellError("invalid_arguments", `Expected boolean: ${key}`);
  }

  return value;
}
