const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');

class DeployAnalyzer {
  constructor() {
    this.aiEndpoint = process.env.AZURE_AI_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
    this.aiKey = process.env.AZURE_AI_KEY || process.env.OPENAI_API_KEY;
    this.aiModel = process.env.AZURE_AI_DEPLOYMENT || 'gpt-4';
  }

  getChangedFiles(fromCommit, toCommit = 'HEAD') {
    try {
      const diffCommand = `git diff --name-status ${fromCommit} ${toCommit}`;
      const output = execSync(diffCommand, { encoding: 'utf-8' });
      
      const changes = output.trim().split('\n').map(line => {
        const [status, ...pathParts] = line.split('\t');
        const path = pathParts.join('\t');
        return {
          status,
          path,
          type: this.getFileType(path)
        };
      });

      return changes;
    } catch (error) {
      console.error('Error getting changed files:', error);
      return [];
    }
  }

  getFileType(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const typeMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'React/TypeScript',
      'jsx': 'React/JavaScript',
      'sql': 'SQL',
      'json': 'Config',
      'env': 'Environment',
      'md': 'Documentation',
      'css': 'Styles',
      'html': 'HTML'
    };
    return typeMap[ext] || 'Other';
  }

  async analyzeWithAI(changes) {
    const changedFiles = changes.filter(c => c.status !== 'D').slice(0, 10);
    
    if (changedFiles.length === 0) {
      return { summary: 'No significant changes to analyze', details: [] };
    }

    const filesSummary = changedFiles.map(c => 
      `{c.status === 'A' ? 'Added' : 'Modified'}: ${c.path} (${c.type})`
    ).join('\n');

    const prompt = `You are a senior software engineer reviewing a deployment. Analyze these code changes and provide:

1. **Security Risks** - Any potential vulnerabilities
2. **Breaking Changes** - Changes that might break functionality
3. **Performance Impact** - Performance issues or improvements
4. **Code Quality** - Issues with structure, naming, patterns
5. **Missing Tests** - Areas needing test coverage
6. **Deployment Risks** - What could go wrong

Changes in this deployment:
${filesSummary}

Provide analysis in this format:
- 🔴 Critical Issues: [list or "None"]
- 🟡 Warnings: [list or "None"]
- 🟢 Improvements: [list]
- 📝 Recommendations: [specific actionable items]

Be specific and reference file names.`;

    try {
      const response = await axios.post(
        this.aiEndpoint,
        {
          model: this.aiModel,
          messages: [
            { role: 'system', content: 'You are an expert code reviewer focused on security, performance, and reliability.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.aiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        summary: response.data.choices[0].message.content,
        fileCount: changedFiles.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI analysis error:', error.response?.data || error.message);
      return {
        summary: 'AI analysis unavailable',
        error: error.message
      };
    }
  }

  async generateReport(fromCommit, toCommit = 'HEAD') {
    console.log(`\n🔍 Analyzing deployment from ${fromCommit} to ${toCommit}...\n`);

    const changes = this.getChangedFiles(fromCommit, toCommit);
    
    const stats = {
      added: changes.filter(c => c.status === 'A').length,
      modified: changes.filter(c => c.status === 'M').length,
      deleted: changes.filter(c => c.status === 'D').length,
      total: changes.length
    };

    console.log(`📊 Changes: ${stats.added} added, ${stats.modified} modified, ${stats.deleted} deleted\n`);

    const aiAnalysis = await this.analyzeWithAI(changes);

    return {
      commitRange: `{fromCommit}...${toCommit}`,
      stats,
      changes,
      aiAnalysis,
      generatedAt: new Date().toISOString()
    };
  }

  async postToSlack(report) {
    const slackWebhook = process.env.SLACK_DEPLOY_WEBHOOK;
    if (!slackWebhook) return;

    const message = {
      text: `🚀 Deployment Analysis: ${report.commitRange}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🚀 Deployment Analysis' }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Commit Range:* ${report.commitRange}\n*Files Changed:* ${report.stats.total} (${report.stats.added} added, ${report.stats.modified} modified, ${report.stats.deleted} deleted)`
          }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: report.aiAnalysis.summary }
        }
      ]
    };

    try {
      await axios.post(slackWebhook, message);
      console.log('✅ Report posted to Slack');
    } catch (error) {
      console.error('Error posting to Slack:', error.message);
    }
  }
}

module.exports = DeployAnalyzer;
