# Template Law MCP Shell

Copy-ready template for building country-specific law MCP servers on top of one shared shell.

The goal is to keep MCP/runtime code stable and isolate country differences in adapters. This template follows the **MCP Infrastructure Blueprint** for infrastructure-grade quality.

## Included

- Shared shell runtime:
  - tool definitions
  - tool dispatch
  - structured error model
  - adapter registry
- Reusable adapter helpers:
  - in-memory search/get
  - regex citation parse/validate
  - static ingestion runner
- Starter adapters:
  - `se` (Sweden)
  - `no` (Norway)
- Country scaffolder command:
  - `npm run scaffold:country -- --code de --name Germany --language de --source gesetze-im-internet`
- Tests:
  - shell routing
  - adapter contract checks
  - contract tests with golden fixtures
- Infrastructure:
  - drift detection (`npm run drift:detect`)
  - health and version endpoints
  - SBOM generation (CycloneDX)
  - CI/CD workflows

## Quick start

```bash
npm install
npm run validate
```

Run a tool call from stdin JSON:

```bash
echo '{"name":"law.list_countries","arguments":{}}' | npm run dev
```

## Create a new country (one command)

```bash
npm run scaffold:country -- --code de --name Germany --language de --source gesetze-im-internet
```

What gets generated:

- `src/adapters/de.ts`
- `src/sample-data/de-legislation.ts`
- `test/de.adapter.test.ts`
- auto-registration in `src/adapters/index.ts` (can disable with `--no-register`)

Dry run mode:

```bash
npm run scaffold:country -- --code fr --name France --language fr --source legifrance --dry-run
```

## Data Sources

Each country adapter declares its data sources in `sources.yml`. This file tracks provenance, update frequency, and licensing for all ingested data.

| Field | Description |
|-------|-------------|
| `name` | Human-readable source name |
| `url` | Official source URL |
| `format` | Data format (HTML, XML, JSON, API) |
| `license` | License or terms of use |
| `refresh` | Update frequency (daily, weekly, monthly) |
| `coverage` | What the source provides (statutes, case law, preparatory works) |

## Contract Tests

Contract tests verify that each country adapter satisfies the shared interface contract using golden fixtures.

```bash
# Run contract tests
npm run test:contract

# Run all tests (unit + contract)
npm run validate
```

Golden test fixtures live in `__tests__/contract/golden-tests.json`. Each fixture defines an input tool call and expected output shape, ensuring adapters return consistent responses.

## Health & Version

The server exposes health and version information:

```bash
# Check health (requires running server)
npm run health

# Or directly
curl -s http://localhost:3000/health | jq .
```

Response:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "countries": ["se", "no"],
  "uptime": 12345
}
```

## Drift Detection

Drift detection compares current data hashes against known-good baselines to catch unexpected changes in source data or ingestion output.

```bash
npm run drift:detect
```

Golden hashes are stored in `__tests__/contract/golden-hashes.json`.

## Project structure

```text
scripts/
  scaffold-country.ts
  drift-detect.ts
src/
  adapters/
    index.ts
    se.ts
    no.ts
  sample-data/
    se-legislation.ts
    no-legislation.ts
  shell/
    adapter-kit.ts
    adapter-registry.ts
    errors.ts
    shell.ts
    tool-contract.ts
    types.ts
  index.ts
__tests__/
  unit/
    shell.test.ts
    adapter.test.ts
  contract/
    golden-tests.json
    golden-hashes.json
    contract.test.ts
test/
  adapter-contract.test.ts
  shell.test.ts
data/
  .gitkeep
docs/
  COUNTRY_CHECKLIST.md
  ARCHITECTURE.md
.github/
  workflows/
    test.yml
    publish.yml
    security.yml
    drift.yml
  ISSUE_TEMPLATE/
    data-error.yml
```

## Core tools

- `law.list_countries`
- `law.describe_country`
- `law.search_documents`
- `law.get_document`
- `law.parse_citation`
- `law.validate_citation`
- `law.run_ingestion`

## Environment

See `.env.example`.

- `LAW_COUNTRIES`: comma-separated country filter (example: `se,no,de`)

## Country rollout checklist

Use `docs/COUNTRY_CHECKLIST.md` when replacing sample adapter logic with real sources.

## Blueprint Compliance

This template implements the **MCP Infrastructure Blueprint** standard. Key compliance areas:

| Area | Status | Notes |
|------|--------|-------|
| Contract tests (golden fixtures) | Implemented | `npm run test:contract` |
| Drift detection (hash baselines) | Implemented | `npm run drift:detect` |
| Health endpoint | Implemented | `GET /health` |
| Version endpoint | Implemented | Included in health response |
| SBOM generation | CI workflow | CycloneDX format |
| Data provenance | Template | `sources.yml` per country |
| Security scanning | CI workflow | Trivy + Semgrep |
| Issue template (data errors) | Included | `.github/ISSUE_TEMPLATE/data-error.yml` |

Architecture reference:

- `docs/ARCHITECTURE.md`

## License

Apache License 2.0. See [LICENSE](LICENSE).
