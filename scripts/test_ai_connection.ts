import { AzureOpenAI } from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testConnection() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

    console.log("Testing connection to:", endpoint);

    if (!endpoint || !apiKey) {
        console.error("❌ Missing credentials in .env.local");
        return;
    }

    try {
        const client = new AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion: "2024-05-01-preview",
            deployment,
        });

        console.log("Sending request to deployment:", deployment);

        const result = await client.chat.completions.create({
            messages: [{ role: "user", content: "Hello, are you active?" }],
            model: deployment,
        });

        console.log("✅ Success! Response:");
        console.log(result.choices[0].message.content);

    } catch (err: any) {
        console.error("❌ Connection failed:");
        console.error(err.message);
        if (err.status) console.error("Status Code:", err.status);
    }
}

testConnection();
