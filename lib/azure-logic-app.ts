
import axios from 'axios';

/**
 * Triggers an Azure Logic App workflow via HTTP Trigger.
 * @param logicAppUrl The full HTTP Trigger URL of the Logic App (including SAS token).
 * @param payload The JSON payload to send to the Logic App.
 */
export async function triggerLogicApp(logicAppUrl: string, payload: any): Promise<any> {
    if (!logicAppUrl) {
        throw new Error("Logic App URL is missing.");
    }

    try {
        console.log(`Triggering Logic App: ${logicAppUrl.split('?')[0]}...`); // Log URL without query params (secrets)
        const response = await axios.post(logicAppUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error: any) {
        console.error("Failed to trigger Logic App:", error.message);
        throw error;
    }
}
