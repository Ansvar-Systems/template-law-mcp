# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Reporting a Vulnerability

Contact: security@ansvar.eu

**Response timeline:**
- Acknowledgment: 48 hours
- Initial assessment: 5 business days
- Resolution target: 30 days (critical), 90 days (other)

## Scope

**In scope:**
- Server code and dependencies
- Build process and CI/CD pipeline
- Data ingestion scripts

**Out of scope:**
- Regulation/legal data content (sourced from official government sources)
- Third-party MCP client implementations

## Security Best Practices

This server implements:
- Automated dependency scanning (Trivy, npm audit)
- Static analysis (CodeQL, Semgrep)
- Secret detection (Gitleaks)
- SBOM generation (CycloneDX)
- npm publish with provenance attestation
