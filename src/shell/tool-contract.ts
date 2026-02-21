import type { ToolDefinition } from "./types.js";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "law.list_countries",
    description:
      "List available country adapters and their capabilities in this server.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "law.describe_country",
    description:
      "Describe supported data sources and capabilities for one country.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country"],
      properties: {
        country: { type: "string", description: "Country code, for example se" },
      },
    },
  },
  {
    name: "law.search_documents",
    description: "Search documents (statutes/cases/etc.) in one country.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "query"],
      properties: {
        country: { type: "string" },
        query: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "law.get_document",
    description: "Get a single document by country and id.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "id"],
      properties: {
        country: { type: "string" },
        id: { type: "string" },
      },
    },
  },
  {
    name: "law.parse_citation",
    description: "Parse and normalize a legal citation in one country.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "citation"],
      properties: {
        country: { type: "string" },
        citation: { type: "string" },
      },
    },
  },
  {
    name: "law.validate_citation",
    description: "Validate a legal citation in one country.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "citation"],
      properties: {
        country: { type: "string" },
        citation: { type: "string" },
      },
    },
  },
  {
    name: "law.run_ingestion",
    description: "Run ingestion/update workflow for one country source.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country"],
      properties: {
        country: { type: "string" },
        sourceId: { type: "string" },
        dryRun: { type: "boolean" },
      },
    },
  },
  // Premium tools — version tracking
  {
    name: "law.get_provision_history",
    description:
      "Get the full version timeline for a specific provision or article. Premium feature — requires Ansvar Intelligence Portal.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "law_identifier", "article"],
      properties: {
        country: { type: "string" },
        law_identifier: { type: "string", description: "Law or regulation identifier, e.g. 'SFS 2018:1472'" },
        article: { type: "string", description: "Article or section reference, e.g. '1 kap. 2 §'" },
      },
    },
  },
  {
    name: "law.diff_provision",
    description:
      "Show what changed in a provision between two dates. Premium feature — requires Ansvar Intelligence Portal.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "law_identifier", "article", "from_date"],
      properties: {
        country: { type: "string" },
        law_identifier: { type: "string", description: "Law or regulation identifier" },
        article: { type: "string", description: "Article or section reference" },
        from_date: { type: "string", description: "ISO date to diff from, e.g. '2024-01-01'" },
        to_date: { type: "string", description: "ISO date to diff to (defaults to current)" },
      },
    },
  },
  {
    name: "law.get_recent_changes",
    description:
      "List all provisions that changed since a given date. Premium feature — requires Ansvar Intelligence Portal.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["country", "since"],
      properties: {
        country: { type: "string" },
        since: { type: "string", description: "ISO date, e.g. '2024-06-01'" },
        limit: { type: "number", minimum: 1, maximum: 200 },
      },
    },
  },
];
