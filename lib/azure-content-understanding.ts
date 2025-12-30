
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
        const analyzeUrl = `${endpoint}/contentunderstanding/analyzers/${analyzerId}:analyze?api-version=${apiVersion}`;
        console.log(`POST ${analyzeUrl}`);

        const analyzeResponse = await fetch(analyzeUrl, {
            method: 'POST',
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: fileUrl })
        });

        if (!analyzeResponse.ok) {
            const errorHtml = await analyzeResponse.text();
            // Try to parse as JSON if possible
            let errorJson;
            try { errorJson = JSON.parse(errorHtml); } catch (e) { }

            console.error("Analysis request failed status:", analyzeResponse.status);
            console.error("Analysis error details:", errorJson || errorHtml);

            if (analyzeResponse.status === 404) {
                console.error("\n❌ Analyzer 'auditor' not found!");
                console.error("You need to create the analyzer first. Run: npx tsx scripts/create-auditor-analyzer.ts");
            }
            throw new Error(`Analysis request failed: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
        }

        const operationLocation = analyzeResponse.headers.get("operation-location");

        if (!operationLocation) {
            console.error("No operation-location header found");
            throw new Error("No operation-location header in Content Understanding response");
        }

        console.log("Analysis started successfully");
        console.log("Polling operation location:", operationLocation);

        // Step 2: Poll for results
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const statusResponse = await fetch(operationLocation, {
                headers: {
                    "Ocp-Apim-Subscription-Key": apiKey,
                },
            });

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                throw new Error(`Polling failed: ${statusResponse.status} ${errorText}`);
            }

            const statusData = await statusResponse.json();
            const status = statusData.status;
            console.log(`Poll attempt ${attempts + 1}/${maxAttempts}: Status = ${status}`);

            if (status === "succeeded") {
                const result = statusData.result;
                console.log("✅ Content Understanding analysis complete!");
                console.log(`Extracted ${result.tables?.length || 0} tables, ${result.paragraphs?.length || 0} paragraphs`);

                return {
                    tables: result.tables || [],
                    paragraphs: result.paragraphs || [],
                    pages: result.pages || [],
                };
            } else if (status === "failed") {
                console.error("Analysis failed:", statusData.error);
                throw new Error(
                    `Content Understanding analysis failed: ${JSON.stringify(statusData.error)}`
                );
            }

            attempts++;
        }

        throw new Error("Analysis timeout - took longer than 2 minutes");
    } catch (error: any) {
        console.error("=== CONTENT UNDERSTANDING ERROR ===");
        console.error("Analyzer ID:", analyzerId);
        console.error("Endpoint:", endpoint);
        console.error("Error Message:", error.message);

        try {
            const fs = require('fs');
            const debugLog = `\n=== CONTENT UNDERSTANDING ERROR ${new Date().toISOString()} ===\nMsg: ${error.message}\n`;
            fs.appendFileSync('azure-error.log', debugLog);
        } catch (e) {
            // ignore log error
        }

        throw error;
    }
}
