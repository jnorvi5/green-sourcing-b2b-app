# Custom Agents for GitHub Copilot

This directory contains custom agent definitions for GitHub Copilot.

## What are Custom Agents?

Custom agents are specialized AI agents that you can define for your repository to perform specific tasks. They extend GitHub Copilot's capabilities with repository-specific knowledge and workflows.

## How to Create a Custom Agent

### File Structure

Custom agent files must be placed in `.github/agents/` and follow this naming convention:
- File name: `<agent-name>.agent.md`
- Location: `.github/agents/<agent-name>.agent.md`

### File Format

Each custom agent file must include:

1. **YAML Frontmatter** (required) - Defines the agent metadata
2. **Markdown Content** (optional) - Provides instructions and context

#### Example Structure

```markdown
---
name: agent-name
description: A brief description of what this agent does
---

# Agent Title

Detailed instructions for the agent...

## What This Agent Does

- Task 1
- Task 2
- Task 3

## How to Use This Agent

Instructions for using the agent...
```

### YAML Frontmatter Requirements

The YAML frontmatter must be enclosed in `---` delimiters and include:

- **name**: The agent's identifier (lowercase, hyphen-separated)
- **description**: A brief description of the agent's purpose

**Important**: Make sure there's a space after the colon in YAML syntax:
- ✅ Correct: `name: my-agent`
- ❌ Incorrect: `name:my-agent`

### Common Mistakes to Avoid

1. ❌ **Wrong directory structure**: Don't create nested `.github` directories
   - Wrong: `.github/agents/.github/my-agent.agent.md`
   - Right: `.github/agents/my-agent.agent.md`

2. ❌ **Missing YAML frontmatter**: The file must start with YAML metadata
   ```markdown
   # My Agent ← This will NOT work without frontmatter
   ```

3. ❌ **Malformed YAML**: Missing spaces after colons
   ```yaml
   name:my-agent ← Wrong (no space after colon)
   name: my-agent ← Correct
   ```

4. ❌ **Wrong file extension**: Must end with `.agent.md`
   - Wrong: `my-agent.md`
   - Right: `my-agent.agent.md`

## Available Agents in This Repository

### code-reviewer

**File**: `code-reviewer.agent.md`

Reviews the entire repository for code, configuration, and deployment errors with focus on:
- Path and import issues
- Missing or outdated assets (logos, images)
- Routing problems
- Build/deploy misconfigurations

## Testing Your Custom Agent

1. Ensure the file is in the correct location: `.github/agents/<name>.agent.md`
2. Verify the YAML frontmatter is properly formatted
3. Commit and push the file to the default branch
4. The agent should become available in GitHub Copilot

## Resources

- [GitHub Custom Agents Documentation](https://gh.io/customagents/config)
- [Copilot CLI for Testing](https://gh.io/customagents/cli)

## Troubleshooting

**Problem**: "Custom agent not found" or agents not appearing

**Solutions**:
1. Check file location: Must be in `.github/agents/`
2. Verify file name ends with `.agent.md`
3. Ensure YAML frontmatter is present and valid
4. Confirm the file is committed to the default branch
5. Check for any nested `.github` directories and remove them
