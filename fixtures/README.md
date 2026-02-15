# Fixtures

Contract test fixtures for the MCP Infrastructure Blueprint.

Reference: `docs/mcp-infrastructure-blueprint.md` (Ansvar Architecture Documentation)

## Files

### golden-tests.json

Contract test definitions. Each test specifies a tool call, input, and assertions about the response.

**Minimum 10 tests required** covering:
- `article_retrieval` (3+) — core lookup with known identifiers
- `search` (2+) — FTS/search returns relevant results
- `citation_roundtrip` (2+) — citations include official URLs / stable IDs
- `negative_test` (2+) — graceful handling of bad input

Run with: `npm run test:contract`

### golden-hashes.json

Drift detection anchors. Each entry contains the SHA-256 hash of a normalized upstream provision text.

**5-10 stable provisions per jurisdiction.** Pick:
- Constitutional articles
- Definition sections
- Scope articles
- Avoid: budget laws, temporary acts, frequently amended regulations

Run with: `npm run drift:detect`

## When to update

- **golden-tests.json**: When adding new tools, changing response schemas, or after data refresh
- **golden-hashes.json**: When upstream text genuinely changes (new consolidation, amendment)

## Assertion types

| Assertion | Type | Description |
|-----------|------|-------------|
| `result_not_empty` | boolean | Response is not null/undefined/empty |
| `text_contains` | string[] | Response text includes ALL substrings |
| `any_result_contains` | string[] | At least one result contains at least one substring |
| `fields_present` | string[] | Response object has these keys |
| `text_not_empty` | boolean | Text field is non-empty string |
| `min_results` | number | At least N results returned |
| `citation_url_pattern` | string | Citation URL matches regex |
| `upstream_text_hash` | string | SHA-256 of normalized text matches |
| `citation_resolves` | `{ snippet }` | Nightly: fetch URL and verify snippet |
| `handles_gracefully` | boolean | Does not throw |
