
// Registry of all 12 agents with their IDs and configuration keys.
// This allows the Orchestrator to find and invoke them.

export const AGENT_REGISTRY = {
    // 1. Legal Guardian - Compliance and Risk Analysis
    "legal-guardian": {
        idEnvVar: "AGENT_LEGAL_GUARDIAN_ID",
        description: "Analyzes text for legal and compliance risks (Anti-Greenwashing, Supply Chain).",
        endpoint: "/api/agents/legal-guardian"
    },
    // 2. RFQ Researcher (Data Scout) - Material Research
    "rfq-researcher": {
        idEnvVar: "AGENT_RFQ_RESEARCHER_ID", // Or reuse Data Scout
        description: "Researches material availability, EPDs, and price benchmarks.",
        endpoint: "/api/agents/rfq-researcher"
    },
    // 3. Orchestrator - Coordination
    "orchestrator": {
        idEnvVar: "AGENT_ORCHESTRATOR_ID",
        description: "Coordinates other agents to fulfill complex requests.",
        endpoint: "/api/agents/orchestrator"
    },
    // 4. Commander - Site Health & Admin
    "commander": {
        idEnvVar: "AGENT_COMMANDER_ID",
        description: "Oversees site health, pending approvals, and admin alerts.",
        endpoint: "/api/agents/commander"
    },
    // 5. Email Writer - Outreach
    "email-writer": {
        idEnvVar: "AGENT_OUTREACH_SCALER_ID",
        description: "Generates professional B2B emails for various contexts.",
        endpoint: "/api/agents/email-writer"
    },
    // 6. Assistant - General Help
    "assistant": {
        idEnvVar: "AGENT_ASSISTANT_ID",
        description: "General purpose assistant for user queries.",
        endpoint: "/api/agents/assistant"
    },
    // 7. Scraper - Supplier Data
    "scraper": {
        idEnvVar: "AGENT_SCRAPER_ID",
        description: "Scrapes supplier websites for product data.",
        endpoint: "/api/agents/scraper"
    },
    // 8. Social Media - Content Generation
    "social-media": {
        idEnvVar: "AGENT_SOCIAL_MEDIA_ID",
        description: "Generates social media posts (LinkedIn, Twitter).",
        endpoint: "/api/agents/social-media"
    },
    // 9. Data Scout - EPD & Certification Data (Specific)
    "data-scout": {
        idEnvVar: "AGENT_DATA_SCOUT_ID",
        description: "Fetches specific EPD and certification data from APIs.",
        endpoint: "/api/agents/data-scout"
    },
    // 10. Logic App - Workflow Automation
    "logic-app": {
        idEnvVar: "AZURE_LOGIC_APP_URL",
        description: "Triggers Azure Logic App workflows.",
        endpoint: "/api/agents/logic-app"
    },
    // 11. Content Understanding - Document Analysis
    "content-understanding": {
        idEnvVar: "AZURE_CONTENT_UNDERSTANDING_ENDPOINT",
        description: "Extracts structured data from documents (PDFs, Images).",
        endpoint: "/api/agents/content-understanding"
    },
    // 12. Email Agent - (Legacy/Specific)
    "email": {
        idEnvVar: "AGENT_EMAIL_ID",
        description: "Handles email sending operations.",
        endpoint: "/api/agents/email"
    }
} as const;

export type AgentName = keyof typeof AGENT_REGISTRY;

export function getAgentConfig(name: AgentName) {
    return AGENT_REGISTRY[name];
}
