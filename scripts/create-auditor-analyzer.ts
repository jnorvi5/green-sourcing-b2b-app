import axios from "axios";
import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const endpoint = process.env.AZURE_CONTENT_UNDERSTANDING_ENDPOINT!;
const apiKey = process.env.AZURE_CONTENT_UNDERSTANDING_KEY!;
const endpoint = process.env['AZURE_CONTENT_UNDERSTANDING_ENDPOINT']!;
const apiKey = process.env['AZURE_CONTENT_UNDERSTANDING_KEY']!;
const apiVersion = "2025-05-01-preview";

async function createAuditorAnalyzer() {
    if (!endpoint || !apiKey) {
        console.error("❌ Missing AZURE_CONTENT_UNDERSTANDING_ENDPOINT or AZURE_CONTENT_UNDERSTANDING_KEY in .env.local");
        return;
    }

    try {
        console.log("Creating 'auditor' analyzer...");

        const analyzerConfig = {
            analyzerId: "auditor",
            displayName: "EPD Auditor Analyzer",
            description: "Extracts tables, paragraphs, and layout from EPD documents",
            kind: "documentAnalyzer",
            // Define schema for what to extract
            outputSchema: {
                fields: [
                    {
                        name: "tables",
                        type: "array",
                        description: "All tables extracted from the document"
                    },
                    {
                        name: "paragraphs",
                        type: "array",
                        description: "All text paragraphs from the document"
                    },
                    {
                        name: "documentTitle",
                        type: "string",
                        description: "Title of the EPD document"
                    },
                    {
                        name: "productName",
                        type: "string",
                        description: "Name of the product described in the EPD"
                    }
                ]
            }
        };

        const response = await axios.put(
            `${endpoint}/contentunderstanding/analyzers/auditor?api-version=${apiVersion}`,
            analyzerConfig,
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Analyzer 'auditor' created successfully!");
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error("❌ Error creating analyzer:");
        console.error("Status:", error.response?.status);
        console.error("Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("Message:", error.message);
    } catch (error) {
        const err = error as AxiosError;
        console.error("❌ Error creating analyzer:");
        console.error("Status:", err.response?.status);
        console.error("Data:", JSON.stringify(err.response?.data, null, 2));
        console.error("Message:", err.message);
    }
}

createAuditorAnalyzer();
