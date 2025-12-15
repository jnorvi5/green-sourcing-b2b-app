# Link Checking Guide

This document describes the automated link checking system implemented for the GreenChainz repository.

## Overview

The repository now includes automated link checking for all Markdown and HTML files to ensure documentation stays accurate and up-to-date. This helps prevent broken links in:
- Documentation files (*.md)
- Static landing pages (*.html)
- Project guides and READMEs

## Components

### 1. Lychee Link Checker
[Lychee](https://github.com/lycheeverse/lychee) is a fast, async link checker that validates both internal and external links.

**Configuration**: `lychee.toml`

### 2. NPM Script
**Command**: `npm run check:links`

This runs the link checker across all documentation and HTML files in the repository.

**Examples**:
```bash
# Check all links (including external)
npm run check:links

# Check only internal/offline links (faster)
npm run check:links -- --offline

# Check specific files
npm run check:links -- README.md DOCUMENTATION-INDEX.md

# Verbose output
npm run check:links -- --verbose
```

### 3. GitHub Action
**Workflow**: `.github/workflows/link-check.yml`

Automatically runs on:
- Pull requests (when Markdown or HTML files change)
- Pushes to main/master branch
- Manual trigger via workflow_dispatch

**Features**:
- Comments on PRs with link check results
- Uploads results as artifacts
- Fails the CI if broken links are found

## Configuration (lychee.toml)

Key configuration options:

### Excluded URLs
The following URLs are excluded from checking:
- Localhost URLs (development servers)
- Example/placeholder URLs (greenchainz.com variations)
- Authentication-required URLs (Vercel, Supabase dashboards)
- Unsplash images (rate limiting issues)
- Email addresses (excluded by default)

### Accepted Status Codes
- 200-206: Success codes
- 429: Rate limiting (treated as success)
- 999: LinkedIn bot protection (treated as success)

### Timeouts & Retries
- Timeout: 20 seconds per request
- Max retries: 3 attempts
- Max concurrency: 10 parallel requests

## Files Covered

The link checker scans:
- `*.md` - All Markdown files in root
- `*.html` - All HTML files in root
- `docs/**/*.md` - Documentation subdirectory
- `aws/**/*.md` - AWS infrastructure docs
- `database-schemas/**/*.md` - Database documentation
- `marketing/**/*.md` - Marketing materials
- `.github/**/*.md` - GitHub-specific docs

## Broken Links Fixed

The following broken internal links were identified and fixed:

### DEPLOYMENT-SUMMARY.md
- ❌ `docs/VERCEL-SUPABASE-QUICKSTART.md` → ✅ `DEPLOYMENT-VERIFICATION-GUIDE.md`
- ❌ `ACTION-CHECKLIST.md` → ✅ Removed (obsolete)
- ❌ `docs/CLOUD-STRATEGY.md` → ✅ `CLOUD-DEPLOYMENT.md`

### aws/README.md
- ❌ `../lambda/README.md` → ✅ Created file with documentation

### claud4.5.md
- ❌ References to non-existent files → ✅ Updated to point to existing documentation

## Workflow in CI/CD

### On Pull Request
1. Link checker runs automatically
2. Results are posted as a comment on the PR
3. CI fails if broken links are found
4. Developer must fix links before merge

### On Push to Main
1. Link checker validates all links
2. Results are uploaded as artifacts
3. Team is notified if issues are found

### Manual Trigger
You can manually trigger the workflow:
1. Go to Actions tab in GitHub
2. Select "Link Checker" workflow
3. Click "Run workflow"

## Troubleshooting

### False Positives

If you encounter false positives (valid links reported as broken):

**Option 1: Add to exclude list in `lychee.toml`**
```toml
exclude = [
  "^https://example.com/path"
]
```

**Option 2: Add to accepted status codes**
```toml
accept = [200, 201, 429, 503]  # Add 503 if needed
```

### Rate Limiting

Some external services (GitHub, LinkedIn, etc.) may rate-limit requests. The checker handles this by:
- Accepting 429 status codes
- Using appropriate user agent
- Setting reasonable timeouts
- Caching results

### Network Errors

Network errors during CI runs are common for external links. The configuration:
- Excludes authentication-required URLs
- Retries failed requests 3 times
- Uses 20-second timeout per request

## Best Practices

### Writing Documentation

1. **Use relative paths for internal links**:
   ```markdown
   ✅ [Deployment Guide](DEPLOYMENT.md)
   ❌ [Deployment Guide](https://github.com/jnorvi5/green-sourcing-b2b-app/blob/main/DEPLOYMENT.md)
   ```

2. **Verify links before committing**:
   ```bash
   npm run check:links -- --offline
   ```

3. **Keep documentation structure flat**:
   - Avoid deep nesting when possible
   - Use clear, descriptive filenames

4. **Update links when moving files**:
   - Search for references before renaming
   - Use `grep -r "old-filename" .` to find references

### Maintaining the System

1. **Review excluded URLs periodically**:
   - Remove exclusions for URLs that are now stable
   - Add new placeholder URLs as needed

2. **Update lychee version**:
   - Check for new releases quarterly
   - Update in `.github/workflows/link-check.yml`

3. **Monitor CI failures**:
   - Address broken links promptly
   - Investigate patterns in failures

## Resources

- [Lychee Documentation](https://lychee.cli.rs/)
- [Lychee GitHub Repository](https://github.com/lycheeverse/lychee)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues with the link checker:
1. Check this guide first
2. Review `lychee.toml` configuration
3. Check GitHub Actions logs
4. Open an issue with details about the problem

---

**Last Updated**: December 2025  
**Maintainer**: GreenChainz Development Team
