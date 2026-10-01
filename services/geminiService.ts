
/**
 * Gemini AI Client Service
 * Calls server-side proxy routes to ensure API key security and full compatibility.
 */

export async function generateJobDescription(shortNotes: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortNotes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    return data.text || "Failed to generate description.";
  } catch (error: any) {
    console.error("Gemini Generate Description Error:", error);
    return "Error generating content. Please try manual entry.";
  }
}

export async function draftBillingItems(narrative: string): Promise<any> {
  try {
    const res = await fetch("/api/ai/draft-billing-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narrative }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini Drafting Error:", error);
    return { materials: [], labour: [] };
  }
}

export async function parseJobFromPDFText(rawText: string): Promise<any> {
  try {
    const res = await fetch("/api/ai/parse-job-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini PDF Parsing Error:", error);
    throw error;
  }
}

export async function diagnoseElectricalFaultAndQuote(faultDescription: string): Promise<any> {
  try {
    const res = await fetch("/api/ai/diagnose-fault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faultDescription }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini Fault Diagnosis Error:", error);
    throw error;
  }
}

export async function parseQuoteFromText(rawText: string, targetType: 'quote' | 'invoice'): Promise<any> {
  try {
    const res = await fetch("/api/ai/parse-quote-ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText, targetType }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Gemini Quote OCR Parsing Error:", error);
    throw error;
  }
}



