export async function searchEPDs(query: string) {
  const apiKey = process.env.EPD_INTERNATIONAL_API_KEY;

  // 1. Safety Check: If no key, return empty list (Don't crash)
  if (!apiKey) {
    console.warn("⚠️ EPD API Key missing. Returning mock results.");
    return {
      data: [],
      meta: { total: 0, note: "Mock mode - Key missing" }
    };
  }

  try {
    const response = await fetch(`https://api.environdec.com/api/v1/epd?q=${query}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`EPD API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("EPD Fetch Failed:", error);
    // Return empty list on error (Prevent app crash)
    return { data: [] };
  }
}
