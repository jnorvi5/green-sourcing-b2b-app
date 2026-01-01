
## Azure Agents Environment Variables
Ensure these are set in your Azure App Service Configuration.

### Azure Foundry / AI Agents
- `AZURE_FOUNDRY_PROJECT_ENDPOINT`: Endpoint for your Azure AI Project.
- `AZURE_FOUNDRY_PROJECT_API_KEY`: API Key for the project.

### Specific Agent IDs
- `AGENT_LEGAL_GUARDIAN_ID`: ID for the Legal Guardian agent.
- `AGENT_RFQ_RESEARCHER_ID`: ID for the RFQ Researcher agent.
- `AGENT_ORCHESTRATOR_ID`: ID for the Orchestrator agent.
- `AGENT_COMMANDER_ID`: ID for the Commander agent.
- `AGENT_OUTREACH_SCALER_ID`: ID for the Email Writer agent.
- `AGENT_DATA_SCOUT_ID`: ID for Data Scout (if using separate agent).
- `AGENT_ASSISTANT_ID`: ID for Assistant.
- `AGENT_SCRAPER_ID`: ID for Scraper.
- `AGENT_SOCIAL_MEDIA_ID`: ID for Social Media agent.
- `AGENT_EMAIL_ID`: ID for Email agent.

### Azure Services
- `AZURE_LOGIC_APP_URL`: HTTP Trigger URL for the main Logic App.
- `AZURE_CONTENT_UNDERSTANDING_ENDPOINT`: Endpoint for Content Understanding.
- `AZURE_CONTENT_UNDERSTANDING_KEY`: Key for Content Understanding.
- `AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID`: Analyzer ID (default: "auditor").

### Legacy / Direct API Keys
- `AZURE_OPENAI_API_KEY`: Fallback for direct OpenAI calls.
- `AZURE_OPENAI_ENDPOINT`: Endpoint for direct OpenAI calls.
- `EPD_INTERNATIONAL_API_KEY`: For Data Scout direct API access.
