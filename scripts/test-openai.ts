import { AzureOpenAI } from "openai";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testConnection() {
    console.log("=== Testing Azure OpenAI Connection ===");

    const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
    const apiKey = process.env['AZURE_OPENAI_KEY'];
    const deployment = process.env['AZURE_OPENAI_DEPLOYMENT'] || "gpt-4o";
    const effectiveApiKey = apiKey || process.env['AZURE_OPENAI_API_KEY'];

    console.log("Configuration:");
    console.log(`- Endpoint: ${endpoint}`);
    console.log(`- Deployment: ${deployment}`);
    console.log(`- API Key Present: ${!!effectiveApiKey}`);
    if (effectiveApiKey) {
        console.log(`- API Key (first 5 chars): ${effectiveApiKey.substring(0, 5)}...`);
        console.log(`- API Key (last 5 chars): ...${effectiveApiKey.substring(effectiveApiKey.length - 5)}`);
    }

    if (!endpoint || !effectiveApiKey) {
        console.error("❌ Missing credentials");
        return;
    }

    try {
        const client = new AzureOpenAI({
            endpoint,
            apiKey: effectiveApiKey,
            deployment,
            apiVersion: "2024-08-01-preview",
        });

        console.log("\nSending test request...");
        const result = await client.chat.completions.create({
            messages: [{ role: "user", content: "Hello, are you working?" }],
            model: deployment,
            max_tokens: 10,
        });

        console.log("✅ Success!");
        console.log("Response:", result.choices[0].message.content);
    } catch (error: any) {
        console.error("\n❌ Connection Failed");
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("Type:", error.type);
        console.error("Message:", error.message);

        if (error.status === 401) {
            console.log("\nPossible Causes for 401:");
            console.log("1. Invalid API Key");
            console.log("2. Key does not match the Endpoint (different resource?)");
            console.log("3. Key expired or disabled");
        } else if (error.status === 404) {
            console.log("\nPossible Causes for 404:");
            console.log(`1. Deployment '${deployment}' not found in this Azure resource`);
            console.log("2. Endpoint URL is incorrect");
        }
    }
}

testConnection();
