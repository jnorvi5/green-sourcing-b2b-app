# Custom Agents Configuration Fix

## Problem Statement

Custom agents were not being recognized in the repository due to several configuration issues.

## Issues Identified

1. **Incorrect Directory Structure**
   - Files were placed in `.github/agents/.github/` (nested directory)
   - Should be in `.github/agents/` directly

2. **Missing YAML Frontmatter**
   - The `my-agent.agent.md` file had no YAML metadata
   - Custom agents require YAML frontmatter with `name` and `description`

3. **Malformed YAML Syntax**
   - `copilot-code-reviewer.md` had `name:CODEREVIEWER` (no space after colon)
   - Correct YAML requires: `name: CODEREVIEWER`

4. **Inconsistent File Naming**
   - Some files didn't follow the `.agent.md` extension convention

## Solutions Implemented

### 1. Fixed Directory Structure

**Before:**
```
.github/agents/
├── .github/
│   ├── copilot-code-review.md
│   └── copilot-code-reviewer.md
└── my-agent.agent.md
```

**After:**
```
.github/agents/
├── README.md
└── code-reviewer.agent.md
```

### 2. Added Proper YAML Frontmatter

The agent file now includes valid YAML metadata:

```yaml
---
name: code-reviewer
description: Reviews the entire repo for code, configuration, and deployment errors with focus on paths, imports, branding issues, and deployment problems
---
```

### 3. Renamed Agent File

- Old name: `my-agent.agent.md`
- New name: `code-reviewer.agent.md`
- More descriptive and follows naming conventions

### 4. Created Documentation

Added comprehensive documentation in `.github/agents/README.md` covering:
- How to create custom agents
- File format requirements
- Common mistakes to avoid
- Troubleshooting guide
- Examples

## How to Use the Custom Agent

Once this PR is merged to the default branch, the `code-reviewer` agent will be available in GitHub Copilot.

### What the Agent Does

The code-reviewer agent:
- Reviews code, configuration, and deployment errors
- Checks for path and import issues
- Identifies missing or outdated assets
- Analyzes routing and accessibility
- Highlights build/deploy misconfigurations
- Provides prioritized reports with suggested fixes

## Verification Checklist

- ✅ Agent file in correct location: `.github/agents/code-reviewer.agent.md`
- ✅ Valid YAML frontmatter with `name` and `description`
- ✅ Proper file naming convention (`.agent.md` extension)
- ✅ No nested `.github` directories
- ✅ Documentation created for future reference
- ✅ Changes committed and pushed

## Next Steps

1. Merge this PR to the default branch
2. Wait for GitHub to recognize the custom agent (may take a few minutes)
3. The agent should appear in GitHub Copilot's agent list
4. You can then invoke it using `@code-reviewer` in Copilot

## Creating Additional Custom Agents

To create more custom agents in the future, follow the template in `.github/agents/README.md`:

```markdown
---
name: agent-name
description: Brief description of what the agent does
---

# Agent Title

Detailed instructions for the agent...
```

Place the file in `.github/agents/<agent-name>.agent.md` and commit to the default branch.

## References

- [GitHub Custom Agents Documentation](https://gh.io/customagents/config)
- [Copilot CLI for Testing](https://gh.io/customagents/cli)
- Local documentation: `.github/agents/README.md`
