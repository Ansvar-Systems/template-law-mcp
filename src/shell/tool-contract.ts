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
];
