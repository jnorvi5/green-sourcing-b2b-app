import axios from "axios";

const endpoint = process.env.AZURE_CONTENT_UNDERSTANDING_ENDPOINT;
const apiKey = process.env.AZURE_CONTENT_UNDERSTANDING_KEY;
const analyzerId = process.env.AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID || "auditor";

if (!endpoint || !apiKey) {
    // We don't throw immediately at module level to allow build, but function will fail
    console.warn("Missing Azure Content Understanding credentials");
}

interface LayoutResult {
    tables: any[];
    paragraphs: any[];
    pages: any[];
}

export async function extractEPDLayout(fileUrl: string): Promise<LayoutResult> {
    if (!endpoint || !apiKey) {
        throw new Error("Missing Azure Content Understanding credentials");
    }

    console.log(`Starting EPD extraction with Content Understanding analyzer: ${analyzerId}`);
    console.log(`Document URL: ${fileUrl}`);

    try {
        const apiVersion = "2025-05-01-preview";

        // Step 1: Start analysis with the auditor analyzer
        const analyzeResponse = await axios.post(
            `${endpoint}/contentunderstanding/analyzers/${analyzerId}:analyze?api-version=${apiVersion}`,
            { url: fileUrl },
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        const operationLocation = analyzeResponse.headers["operation-location"];

        if (!operationLocation) {
            console.error("No operation-location header found");
            console.error("Response headers:", analyzeResponse.headers);
            throw new Error("No operation-location header in Content Understanding response");
        }

        console.log("Analysis started successfully");
        console.log("Polling operation location:", operationLocation);

        // Step 2: Poll for results
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const statusResponse = await axios.get(operationLocation, {
                headers: {
                    "Ocp-Apim-Subscription-Key": apiKey,
                },
            });

            const status = statusResponse.data.status;
            console.log(`Poll attempt ${attempts + 1}/${maxAttempts}: Status = ${status}`);

            if (status === "succeeded") {
                const result = statusResponse.data.result;
                console.log("✅ Content Understanding analysis complete!");
                console.log(`Extracted ${result.tables?.length || 0} tables, ${result.paragraphs?.length || 0} paragraphs`);

                return {
                    tables: result.tables || [],
                    paragraphs: result.paragraphs || [],
                    pages: result.pages || [],
                };
            } else if (status === "failed") {
                console.error("Analysis failed:", statusResponse.data.error);
                throw new Error(
                    `Content Understanding analysis failed: ${JSON.stringify(statusResponse.data.error)}`
                );
            }

            attempts++;
        }

        throw new Error("Analysis timeout - took longer than 2 minutes");
    } catch (error: any) {
        console.error("=== CONTENT UNDERSTANDING ERROR ===");
        console.error("Analyzer ID:", analyzerId);
        console.error("Endpoint:", endpoint);
        console.error("Status Code:", error.response?.status);
        console.error("Error Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("Error Message:", error.message);

        // If analyzer doesn't exist, provide helpful message
        if (error.response?.status === 404) {
            console.error("\n❌ Analyzer 'auditor' not found!");
            console.error("You need to create the analyzer first. Run: npx tsx scripts/create-auditor-analyzer.ts");
        }

        try {
            const fs = require('fs');
            const debugLog = `\n=== CONTENT UNDERSTANDING ERROR ${new Date().toISOString()} ===\nStatus: ${error.response?.status}\nMsg: ${error.message}\nData: ${JSON.stringify(error.response?.data, null, 2)}\n`;
            fs.appendFileSync('azure-error.log', debugLog);
        } catch (e) {
            // ignore log error
        }

        throw error;
    }
}
