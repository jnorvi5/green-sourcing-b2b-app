// Note: This matches the "Azure AI Agent Service" pattern or "Assistant API" pattern.
// We are using standard fetch to avoid complex SDK dependency issues for now, 
// targeting the /threads/runs or /agents/invoke endpoints depending on Foundry setup.

// The standard Foundry/Agent Service URL pattern for invocation:
// POST https://[region].api.azureml.ms/v1/agents/[agentId]/invoke (if exposed this way)
// OR using the OpenAI SDK with Azure client.

// Given the user provided a Project Endpoint, we will assume standard Azure AI Project Agent pattern.

const PROJECT_ENDPOINT = process.env['AZURE_FOUNDRY_PROJECT_ENDPOINT'];
const API_KEY = process.env['AZURE_FOUNDRY_PROJECT_API_KEY'];

export interface AgentResponse {
    success: boolean;
    data?: unknown;
    text?: string;
    error?: string;
}

/**
 * Invokes an Azure Foundry Agent.
 * Note: This implementation assumes the agent is exposed via a Project endpoint 
 * compatible with the Azure AI Agents service (Assistants API).
 * 
 * If the agent is a "Custom Agent" exposed as a pure REST endpoint, provide the full URL.
 */
export async function invokeFoundryAgent(
    agentIdOrUrl: string,
    input: string | object
): Promise<AgentResponse> {
    const isFullUrl = agentIdOrUrl.startsWith('http');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'api-key': API_KEY || '',
    };

    // If we lack credentials, fail fast to avoid timeouts
    if (!API_KEY) {
        console.warn("Missing AZURE_FOUNDRY_PROJECT_API_KEY");
        return { success: false, error: "Configuration missing: API Key" };
    }

    try {
        let url = agentIdOrUrl;
        let body = {};

        if (!isFullUrl) {
            // If it's just an ID, we need to construct the URL or use the Project Endpoint.
            // Current Foundry Preview often uses the Project Endpoint as base.
            // Example: POST [ProjectEndpoint]/agents/[AgentID]/invoke?api-version=2024-05-01-preview
            if (PROJECT_ENDPOINT) {
                // Remove potential trailing slash
                const base = PROJECT_ENDPOINT.endsWith('/') ? PROJECT_ENDPOINT.slice(0, -1) : PROJECT_ENDPOINT;
                url = `${base}/agents/${agentIdOrUrl}/invoke?api-version=2024-05-01-preview`;
            } else {
                return { success: false, error: "Configuration missing: Project Endpoint" };
            }
        }

        if (typeof input === 'string') {
            body = { instructions: input };
        } else {
            body = input;
        }

        console.log(`🚀 Invoking Agent: ${url}`);

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Foundry Agent Error (${response.status}):`, errorText);
            return {
                success: false,
                error: `Agent invocation failed: ${response.status} ${errorText}`
            };
        }

        const result = await response.json();

        // Normalize the response format
        // Foundry agents might return different shapes. We try to extract text or data.
        return {
            success: true,
            data: result,
            text: result.response || result.message || result.completion || JSON.stringify(result)
        };

    } catch (error: unknown) {
        const err = error as Error;
        console.error("Foundry Invocation Exception:", err);
        return { success: false, error: err.message };
    }
}
