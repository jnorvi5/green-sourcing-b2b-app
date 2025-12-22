import { AzureOpenAI } from "openai";
import { extractEPDLayout } from "./azure-content-understanding";

const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
const apiKey = process.env['AZURE_OPENAI_KEY'];
const deployment = process.env['AZURE_OPENAI_DEPLOYMENT'] || "gpt-4o";

const effectiveApiKey = apiKey || process.env['AZURE_OPENAI_API_KEY'];

if (!endpoint || !effectiveApiKey) {
    console.warn("Missing Azure OpenAI credentials");
}

let client: AzureOpenAI | null = null;
if (endpoint && effectiveApiKey) {
    client = new AzureOpenAI({
        endpoint,
        apiKey: effectiveApiKey,
        deployment,
        apiVersion: "2024-08-01-preview",
    });
}


interface AuditResult {
    compliance_score: number;
    carbon_footprint: {
        value: number | null;
        unit: string;
        scope: string;
    };
    certifications: string[];
    lifecycle_stages_covered: string[];
    red_flags: string[];
    recommendation: "APPROVE" | "REVIEW" | "REJECT";
    summary: string;
}

interface FullAuditResult {
    supplier_name: string;
    pdf_url: string;
    audit_result: AuditResult;
    raw_layout: any;
    created_at: string;
}

export async function auditEPD(
    pdfUrl: string,
    supplierName: string
): Promise<FullAuditResult> {
    if (!client) {
        throw new Error("Azure OpenAI client not initialized (missing credentials)");
    }

    console.log(`Starting audit for ${supplierName}`);

    // Step 1: Extract layout ($0.01/page)
    const layoutData = await extractEPDLayout(pdfUrl);

    console.log(
        `Extracted ${layoutData.tables.length} tables, ${layoutData.paragraphs.length} paragraphs`
    );

    // Step 2: Build GPT-4o audit prompt
    const tablesText = layoutData.tables
        .map((table, idx) => {
            const cells = table.cells || [];
            return `Table ${idx + 1}:\n${cells.map((c: any) => c.content).join(" | ")}`;
        })
        .join("\n\n");

    const paragraphsText = layoutData.paragraphs
        .slice(0, 50) // Limit to first 50 paragraphs to avoid token limits
        .map((p: any) => p.content)
        .join("\n");

    const prompt = `You are a GreenChainz sustainability auditor analyzing an Environmental Product Declaration (EPD).

**Supplier:** ${supplierName}

**Extracted Tables:**
${tablesText}

**Extracted Text:**
${paragraphsText}

**Your Task:**
Audit this EPD for compliance and extract key data:

1. **Carbon Footprint:** Find kgCO2eq values (GWP, Global Warming Potential). Look in tables for values with units.
2. **Certifications:** Identify standards mentioned: ISO 14040, ISO 14044, EPD International, EN 15804, TÜV, UL, NSF, LEED, etc.
3. **Completeness:** Check if lifecycle stages are documented (A1-A3 minimum for product stage).
4. **Red Flags:** Missing data, inconsistencies, suspicious claims, lack of third-party verification.

**Scoring Guidelines:**
- 90-100: Complete EPD, verified by third party, clear carbon data, all lifecycle stages
- 70-89: Good EPD, minor gaps (e.g., missing stage A4-A5)
- 50-69: Incomplete EPD, missing certifications or carbon data
- 0-49: Poor quality, major data gaps, no verification

**Output Format (MUST BE VALID JSON, NO MARKDOWN):**
{
  "compliance_score": 85,
  "carbon_footprint": {
    "value": 1.24,
    "unit": "kgCO2eq",
    "scope": "A1-A3"
  },
  "certifications": ["ISO 14040", "EPD International"],
  "lifecycle_stages_covered": ["A1", "A2", "A3"],
  "red_flags": ["Missing stage A4", "No third-party verification"],
  "recommendation": "APPROVE",
  "summary": "Complete product-stage EPD with verified carbon data."
}`;

    // Step 3: Call GPT-4o ($0.50/call)
    console.log("Sending to GPT-4o for analysis...");

    const completion = await client.chat.completions.create({
        model: deployment,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
    });

    const auditText = completion.choices[0].message?.content || "{}";
    console.log("GPT-4o response received");

    // Step 4: Parse JSON from response
    let audit: AuditResult;
    try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = auditText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
            null,
            auditText,
        ];
        const jsonString = jsonMatch[1] || auditText;
        audit = JSON.parse(jsonString.trim());
    } catch (error) {
        console.error("Failed to parse GPT response:", auditText);
        // Fallback audit result
        audit = {
            compliance_score: 0,
            carbon_footprint: { value: null, unit: "unknown", scope: "unknown" },
            certifications: [],
            lifecycle_stages_covered: [],
            red_flags: ["Failed to parse audit data"],
            recommendation: "REJECT",
            summary: "Error processing EPD data",
        };
    }

    return {
        supplier_name: supplierName,
        pdf_url: pdfUrl,
        audit_result: audit,
        raw_layout: {
            table_count: layoutData.tables.length,
            paragraph_count: layoutData.paragraphs.length,
            page_count: layoutData.pages.length,
        },
        created_at: new Date().toISOString(),
    };
}
