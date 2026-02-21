-- Premium tier schema extension for Law MCP servers
-- Add this table to any SQLite-based Law MCP to enable version tracking.
--
-- The parent table name varies per MCP:
--   Law MCPs:         legal_provisions  → provision_versions
--   EU Regulations:   articles          → article_versions
--   US Regulations:   sections          → section_versions
--   Security Controls: controls         → control_versions
--
-- Adjust table/column names to match your MCP's parent table.

CREATE TABLE IF NOT EXISTS provision_versions (
  id INTEGER PRIMARY KEY,
  provision_id INTEGER NOT NULL,
  body_text TEXT NOT NULL,
  effective_date TEXT,            -- when this version took effect legally
  superseded_date TEXT,           -- when next version replaced it (NULL = current)
  scraped_at TEXT NOT NULL,       -- when we captured this snapshot
  change_summary TEXT,            -- AI-generated plain-language summary of what changed
  diff_from_previous TEXT,        -- unified diff against prior version
  source_url TEXT,                -- link to official gazette / amendment document
  FOREIGN KEY (provision_id) REFERENCES legal_provisions(id)
);

CREATE INDEX IF NOT EXISTS idx_pv_provision ON provision_versions(provision_id);
CREATE INDEX IF NOT EXISTS idx_pv_effective ON provision_versions(effective_date);
