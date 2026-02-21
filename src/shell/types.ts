export type CountryCode = string;

export type ToolName =
  | "law.list_countries"
  | "law.describe_country"
  | "law.search_documents"
  | "law.get_document"
  | "law.parse_citation"
  | "law.validate_citation"
  | "law.run_ingestion"
  // Premium tools
  | "law.get_provision_history"
  | "law.diff_provision"
  | "law.get_recent_changes";

export interface CountryDescriptor {
  code: CountryCode;
  name: string;
  defaultLanguage: string;
  sources: string[];
}

export type DocumentKind =
  | "statute"
  | "regulation"
  | "case"
  | "preparatory_work"
  | "other";

export interface LawDocument {
  id: string;
  country: CountryCode;
  kind: DocumentKind;
  title: string;
  citation?: string;
  sourceUrl?: string;
  effectiveDate?: string;
  textSnippet?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResponse {
  documents: LawDocument[];
  total: number;
}

export interface CitationParseResult {
  original: string;
  normalized: string;
  parsed: Record<string, string>;
}

export interface CitationValidationResult {
  valid: boolean;
  normalized?: string;
  reason?: string;
}

export interface IngestionRequest {
  sourceId?: string;
  dryRun?: boolean;
}

export interface IngestionResult {
  startedAt: string;
  finishedAt: string;
  sourceId: string;
  dryRun: boolean;
  ingestedCount: number;
  skippedCount: number;
}

export interface ProvisionVersion {
  effective_date: string | null;
  superseded_date: string | null;
  change_summary: string | null;
  source_url: string | null;
  body_text?: string;
}

export interface ProvisionHistory {
  provision: string;
  current_version: string | null;
  versions: ProvisionVersion[];
}

export interface ProvisionDiff {
  provision: string;
  from_date: string;
  to_date: string;
  diff: string | null;
  change_summary: string | null;
}

export interface RecentChange {
  provision: string;
  effective_date: string;
  change_summary: string | null;
  source_url: string | null;
}

export interface RecentChangesResponse {
  since: string;
  changes: RecentChange[];
  total: number;
}

export interface CountryAdapter {
  country: CountryDescriptor;
  capabilities: {
    documents: boolean;
    citations: boolean;
    ingestion: boolean;
    version_tracking: boolean;
    change_diffs: boolean;
  };
  searchDocuments?(request: SearchRequest): Promise<SearchResponse>;
  getDocument?(id: string): Promise<LawDocument | null>;
  parseCitation?(citation: string): Promise<CitationParseResult | null>;
  validateCitation?(citation: string): Promise<CitationValidationResult>;
  runIngestion?(request: IngestionRequest): Promise<IngestionResult>;
  // Premium methods
  getProvisionHistory?(lawIdentifier: string, article: string): Promise<ProvisionHistory | null>;
  diffProvision?(lawIdentifier: string, article: string, fromDate: string, toDate?: string): Promise<ProvisionDiff | null>;
  getRecentChanges?(since: string, limit?: number): Promise<RecentChangesResponse>;
}

export interface ToolCall {
  name: ToolName;
  arguments?: Record<string, unknown>;
}

export interface ToolResult {
  tool: ToolName;
  ok: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: Record<string, unknown>;
}
