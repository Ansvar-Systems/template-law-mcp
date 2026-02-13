export type CountryCode = string;

export type ToolName =
  | "law.list_countries"
  | "law.describe_country"
  | "law.search_documents"
  | "law.get_document"
  | "law.parse_citation"
  | "law.validate_citation"
  | "law.run_ingestion";

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

export interface CountryAdapter {
  country: CountryDescriptor;
  capabilities: {
    documents: boolean;
    citations: boolean;
    ingestion: boolean;
  };
  searchDocuments?(request: SearchRequest): Promise<SearchResponse>;
  getDocument?(id: string): Promise<LawDocument | null>;
  parseCitation?(citation: string): Promise<CitationParseResult | null>;
  validateCitation?(citation: string): Promise<CitationValidationResult>;
  runIngestion?(request: IngestionRequest): Promise<IngestionResult>;
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
