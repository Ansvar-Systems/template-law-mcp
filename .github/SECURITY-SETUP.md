# GitHub Actions Security Setup

## Required Secrets

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `NPM_TOKEN` | npm publish access | Every 90 days |
| `GITLEAKS_LICENSE` | Gitleaks commercial features (optional) | Annual |

## Optional Secrets

| Secret | Purpose | When Needed |
|--------|---------|-------------|
| `AZURE_CREDENTIALS` | Azure Key Vault access | If using MCP Registry publishing |

## Security Notes

- Rotate secrets every 90 days
- Use Azure Key Vault for shared secrets across repos
- Never commit secrets to the repository
- All workflows use principle of least privilege permissions
