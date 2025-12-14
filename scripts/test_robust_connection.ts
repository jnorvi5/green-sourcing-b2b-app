import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "auditor";

const endpoints = [
    "https://greenchainz-2025.openai.azure.com/",
    "https://greenchainz-2025.services.ai.azure.com/",
    "https://greenchainz-2025.services.ai.azure.com/api/projects/greenchainz" // Unlikely to work with OpenAI SDK straight but worth a shot or parsing
];

async function testEndpoint(endpoint: string) {
    console.log(`Testing Endpoint: ${endpoint}`);
    try {
        const client = new AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion: "2024-05-01-preview",
            deployment,
        });

        const result = await client.chat.completions.create({
            messages: [{ role: "user", content: "Ping" }],
            model: deployment,
        });

        console.log(`✅ SUCCESS with ${endpoint}`);
        console.log(`Response: ${result.choices[0].message.content}`);
        return true;
    } catch (err: any) {
        console.log(`❌ FAILED with ${endpoint}`);
        console.log(`Error: ${err.message}`);
        if (err.status) console.log(`Status: ${err.status}`);
        return false;
    }
}

async function run() {
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }

    for (const ep of endpoints) {
        const success = await testEndpoint(ep);
        if (success) break;
    }
}

run();
