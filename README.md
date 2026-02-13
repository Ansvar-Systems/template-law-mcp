# Template Law MCP Shell

Copy-ready template for building country-specific law MCP servers on top of one shared shell.

The goal is to keep MCP/runtime code stable and isolate country differences in adapters.

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

## Project structure

```text
scripts/
  scaffold-country.ts
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
test/
  adapter-contract.test.ts
  shell.test.ts
docs/
  COUNTRY_CHECKLIST.md
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

Use `/Users/jeffreyvonrotz/Projects/template-law-mcp/docs/COUNTRY_CHECKLIST.md` when replacing sample adapter logic with real sources.

Architecture reference:

- `/Users/jeffreyvonrotz/Projects/template-law-mcp/docs/ARCHITECTURE.md`
