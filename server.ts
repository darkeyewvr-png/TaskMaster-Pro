import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Lazy initialization for Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const UNIVERSAL_BUSINESS_CONTEXT = "The application serves diverse companies including car washes, retail store owners, labour and services contractors, repair technicians, and field operations teams. Assist with professional job scoping, equipment maintenance, service delivery, parts/supplies estimation, and commercial billing.";
const SPECIALTY_CONTEXT = UNIVERSAL_BUSINESS_CONTEXT;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      saasMultiTenant: true,
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.API_KEY),
      hasDiscordConfig: !!process.env.DISCORD_WEBHOOK_JOB_LOGS,
      hasWhatsAppConfig: !!process.env.WHATSAPP_TOKEN
    });
  });

  // --- MULTI-TENANT SAAS ONBOARDING & BILLING ENDPOINTS ---

  // 1. Register New Company & Owner (Self-service SaaS Signup)
  app.post("/api/saas/register-company", async (req, res) => {
    try {
      const { company, owner } = req.body;
      if (!company?.name || !owner?.email) {
        return res.status(400).json({ error: "Company name and owner email are required." });
      }

      const companyId = "comp_" + Math.random().toString(36).substring(2, 9);
      const ownerUid = "usr_" + Math.random().toString(36).substring(2, 9);

      const newCompany = {
        id: companyId,
        name: company.name,
        registrationNumber: company.registrationNumber || "",
        vatNumber: company.vatNumber || "",
        phone: company.phone || "",
        email: company.email || owner.email,
        address: company.address || "",
        website: company.website || "",
        logoUrl: company.logoUrl || "",
        brandColor: company.brandColor || "#2563eb",
        accentColor: company.accentColor || "#f59e0b",
        currency: company.currency || "ZAR",
        currencySymbol: company.currency === "USD" ? "$" : company.currency === "EUR" ? "€" : company.currency === "GBP" ? "£" : "R",
        taxRate: Number(company.taxRate) || 15,
        subscriptionTier: "pro", // Default 14-day Pro trial
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        billingGateway: "payfast",
        planAmount: 1299,
        createdAt: new Date().toISOString()
      };

      const newOwner = {
        uid: ownerUid,
        companyId: companyId,
        email: owner.email,
        name: owner.name || "Business Owner",
        role: "super_admin",
        specialty: owner.specialty || "Managing Director / Field Operations",
        phone: owner.phone || company.phone || "",
        isWorking: false,
        hourlyRate: 500
      };

      // Store in Firestore if available
      try {
        await db.collection("companies").doc(companyId).set(newCompany);
        await db.collection("users").doc(ownerUid).set(newOwner);
      } catch (dbErr) {
        console.warn("Firestore write skipped (fallback mode):", dbErr);
      }

      res.json({
        success: true,
        message: "Company registered successfully with 14-day Pro trial.",
        company: newCompany,
        user: newOwner
      });
    } catch (error: any) {
      console.error("Register Company Error:", error);
      res.status(500).json({ error: error.message || "Failed to register company" });
    }
  });

  // 2. Invite Team Member / Technician
  app.post("/api/saas/invite-technician", async (req, res) => {
    try {
      const { companyId, email, name, role, specialty, phone } = req.body;
      if (!companyId || !email || !name) {
        return res.status(400).json({ error: "companyId, email and name are required." });
      }

      const techUid = "usr_" + Math.random().toString(36).substring(2, 9);
      const newTech = {
        uid: techUid,
        companyId,
        email,
        name,
        role: role === "super_admin" ? "super_admin" : "technician",
        specialty: specialty || "Field Technician",
        phone: phone || "",
        isWorking: false,
        createdAt: new Date().toISOString()
      };

      try {
        await db.collection("users").doc(techUid).set(newTech);
      } catch (err) {
        console.warn("Firestore write skipped:", err);
      }

      const inviteLink = `https://basson-saas.applet.dev/join?companyId=${encodeURIComponent(companyId)}&email=${encodeURIComponent(email)}&token=${techUid}`;

      res.json({
        success: true,
        message: `Invitation generated for ${email}`,
        user: newTech,
        inviteLink
      });
    } catch (error: any) {
      console.error("Invite Technician Error:", error);
      res.status(500).json({ error: error.message || "Failed to invite technician" });
    }
  });

  // 3. Subscription Checkout Session (PayFast / Stripe)
  app.post("/api/saas/create-checkout-session", async (req, res) => {
    try {
      const { companyId, tier, gateway = "payfast", billingCycle = "monthly" } = req.body;
      if (!companyId || !tier) {
        return res.status(400).json({ error: "companyId and tier are required." });
      }

      const tierPricing: Record<string, { monthly: number; yearly: number }> = {
        starter: { monthly: 499, yearly: 4990 },
        pro: { monthly: 1299, yearly: 12990 },
        enterprise: { monthly: 2999, yearly: 29990 }
      };

      const amount = tierPricing[tier]?.[billingCycle as 'monthly' | 'yearly'] || 1299;
      const sessionId = `sess_${gateway}_${Math.random().toString(36).substring(2, 10)}`;

      res.json({
        success: true,
        sessionId,
        gateway,
        amount,
        currency: "ZAR",
        checkoutUrl: `/billing/mock-checkout?session=${sessionId}&gateway=${gateway}&amount=${amount}`,
        message: `Checkout session initialized for ${tier.toUpperCase()} plan via ${gateway.toUpperCase()}`
      });
    } catch (error: any) {
      console.error("Checkout Session Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // 4. PayFast / Stripe Webhook simulation & processor
  app.post("/api/saas/webhook/payfast", async (req, res) => {
    try {
      const { companyId, status, payment_status } = req.body;
      const isSuccess = payment_status === "COMPLETE" || status === "success";

      if (companyId) {
        try {
          await db.collection("companies").doc(companyId).update({
            subscriptionStatus: isSuccess ? "active" : "past_due",
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        } catch (e) {
          console.warn("Firestore update skipped:", e);
        }
      }

      res.json({ received: true, status: isSuccess ? "active" : "past_due" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Update Company White-Label Branding
  app.post("/api/saas/update-branding", async (req, res) => {
    try {
      const { companyId, brandColor, accentColor, logoUrl, name, registrationNumber, vatNumber, phone, address, currency, taxRate } = req.body;
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required." });
      }

      const updates: any = {};
      if (brandColor) updates.brandColor = brandColor;
      if (accentColor) updates.accentColor = accentColor;
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (name) updates.name = name;
      if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
      if (vatNumber !== undefined) updates.vatNumber = vatNumber;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;
      if (currency) {
        updates.currency = currency;
        updates.currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "R";
      }
      if (taxRate !== undefined) updates.taxRate = Number(taxRate);

      try {
        await db.collection("companies").doc(companyId).update(updates);
      } catch (err) {
        console.warn("Firestore update skipped:", err);
      }

      res.json({ success: true, message: "Company branding updated successfully", updates });
    } catch (error: any) {
      console.error("Update Branding Error:", error);
      res.status(500).json({ error: error.message || "Failed to update branding" });
    }
  });

  // 6. Universal AI Quality Inspection & Service Sign-off Summary (Car Wash, Stores, Labour, Services)
  const handleUniversalInspectionSummary = async (req: any, res: any) => {
    try {
      const { companyName, clientName, inspectionType, industry, customMetrics, checklistItems } = req.body;
      
      const ai = getGeminiAI();
      const prompt = `You are a Professional Operations & Quality Assurance Auditor for service and labour companies.
Company: "${companyName || 'Service Contractor'}"
Business Sector / Industry: "${industry || 'General Labour & Services'}"
Client / Customer: "${clientName || 'Valued Client'}"
Inspection / Service Type: "${inspectionType || 'Quality Assurance & Service Sign-Off'}"

Specific Parameters / Metrics:
${JSON.stringify(customMetrics || {})}

Checklist Status Summary:
${JSON.stringify(checklistItems || [])}

Provide:
1. Executive Quality Assurance & Service Completion Summary confirming standard of workmanship suitable for customer sign-off.
2. Status of all critical checkpoints (e.g. cleanliness, inventory, safety, execution quality).
3. Any maintenance tips, follow-up recommendations, or notes for the customer.
4. Definitive pass / completion rating.
Keep tone professional, encouraging, and clear.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.4,
        }
      });

      res.json({ summary: response.text || "Service completed and quality verified to industry standards." });
    } catch (error: any) {
      console.error("AI Service Summary Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quality summary" });
    }
  };

  app.post("/api/ai/generate-service-summary", handleUniversalInspectionSummary);
  app.post("/api/ai/generate-compliance-summary", handleUniversalInspectionSummary);

  // --- GEMINI AI SERVER-SIDE ENDPOINTS ---

  // 1. Generate Job Description
  app.post("/api/ai/generate-description", async (req, res) => {
    try {
      const { shortNotes } = req.body;
      if (!shortNotes) {
        return res.status(400).json({ error: "shortNotes is required" });
      }

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Transform these brief notes into a professional service job description for a commercial work order or job card: "${shortNotes}". ${UNIVERSAL_BUSINESS_CONTEXT}. Format as crisp, professional bullet points or an executive summary suitable for an official job card and client report.`,
        config: {
          temperature: 0.7,
        }
      });

      res.json({ text: response.text || "Job description generated successfully." });
    } catch (error: any) {
      console.error("AI Generate Description Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate job description" });
    }
  });

  // 2. Draft Billing Items
  app.post("/api/ai/draft-billing-items", async (req, res) => {
    try {
      const { narrative } = req.body;
      if (!narrative) {
        return res.status(400).json({ error: "narrative is required" });
      }

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on this service/job description: "${narrative}", suggest a realistic list of billable materials/supplies and labour hours for a quote or invoice. 
        Use standard realistic South African market rates in Rands (ZAR).
        Include appropriate call-out fees or service labour rates.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              materials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER }
                  }
                }
              },
              labour: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    hours: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{"materials":[],"labour":[]}');
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Draft Billing Items Error:", error);
      res.status(500).json({ error: error.message || "Failed to draft billing items" });
    }
  });

  // 3. Diagnose Service Fault & Scope Analysis
  app.post("/api/ai/diagnose-fault", async (req, res) => {
    try {
      const { faultDescription } = req.body;
      if (!faultDescription) {
        return res.status(400).json({ error: "faultDescription is required" });
      }

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an experienced operations manager and service specialist.
        Analyze this reported service issue, client request, or work scope: "${faultDescription}".

        Provide:
        1. Operational summary & key steps
        2. Industry safety and quality control guidelines
        3. Step-by-step diagnostic/execution procedures
        4. Suggested professional work narrative for client report
        5. Estimated supplies/materials and labour (with realistic South African Rand pricing).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              possibleCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              safetyGuidelines: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              troubleshootingSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedNarrative: { type: Type.STRING },
              materials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER }
                  }
                }
              },
              labour: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    hours: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER }
                  }
                }
              }
            },
            required: ["summary", "possibleCauses", "suggestedNarrative"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Fault Diagnosis Error:", error);
      res.status(500).json({ error: error.message || "Failed to diagnose fault" });
    }
  });

  // 4. Parse Job from PDF Text
  app.post("/api/ai/parse-job-pdf", async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText) {
        return res.status(400).json({ error: "rawText is required" });
      }

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Act as a high-precision data extractor for Basson Elektries. Extract details from this job PDF text:
        1. CLIENT & LOCATION: Identify clientName, phone, email, and site address (location).
        2. TIME LOGS: Earliest and latest date/times for startDate and endDate.
        3. WORK DONE: Extract full details into 'workDescription'.
        4. MATERIALS: Extract list into 'materialsUsed'.
        5. NOTES: Extract any extra details into 'technicianNotes'.

        RAW TEXT CONTENT:
        ${rawText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clientName: { type: Type.STRING },
              location: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              workDescription: { type: Type.STRING },
              materialsUsed: { type: Type.STRING },
              technicianNotes: { type: Type.STRING }
            },
            required: ["clientName", "workDescription"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Parse Job PDF Error:", error);
      res.status(500).json({ error: error.message || "Failed to parse job from PDF" });
    }
  });

  // 5. Parse Quote / Invoice from OCR Text
  app.post("/api/ai/parse-quote-ocr", async (req, res) => {
    try {
      const { rawText, targetType } = req.body;
      if (!rawText) {
        return res.status(400).json({ error: "rawText is required" });
      }

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract detailed billing information from this document text for a commercial ${targetType || 'quote'}.
        Identify client name, document number, date, address, contact phone/email, narrative/scope, and all line items.
        Separate line items into 'materials' and 'labour'.

        RAW TEXT:
        ${rawText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clientId: { type: Type.STRING },
              documentNumber: { type: Type.STRING },
              date: { type: Type.STRING },
              address: { type: Type.STRING },
              contactDetails: { type: Type.STRING },
              narrative: { type: Type.STRING },
              materials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER }
                  }
                }
              },
              labour: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    hours: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER }
                  }
                }
              },
              total: { type: Type.NUMBER }
            },
            required: ["clientId", "materials"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Parse Quote OCR Error:", error);
      res.status(500).json({ error: error.message || "Failed to parse document" });
    }
  });

  // API route for sending WhatsApp message
  app.post("/api/sendJobToWhatsApp", async (req, res) => {
    try {
      const { jobId, currentUser } = req.body;
      
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      // 1. Load job data from Firestore
      const jobDoc = await db.collection("jobs").doc(jobId).get();
      if (!jobDoc.exists) {
        return res.status(404).json({ error: "Job not found" });
      }

      const job = jobDoc.data();
      
      // Format dates for display
      const formatDate = (val: any) => {
        if (!val) return 'TBD';
        const date = val.toDate ? val.toDate() : new Date(val);
        return date.toLocaleDateString('en-ZA');
      };

      const formatTime = (val: any) => {
        if (!val) return 'TBD';
        const date = val.toDate ? val.toDate() : new Date(val);
        return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
      };

      // 2. Format WhatsApp message string
      const messageText = `🔧 *Basson Elektries Job Log*

*Client:* ${job?.clientId || 'N/A'}
*Phone:* ${job?.phone || 'N/A'}
*Address:* ${job?.location || 'N/A'}
*Job Type:* ${job?.category || 'N/A'}

*Date:* ${formatDate(job?.startDate)}
*Start Time:* ${formatTime(job?.startDate)}
*End Time:* ${formatTime(job?.endDate)}

*Notes:*
${job?.description || job?.notes || 'No notes provided.'}

*Completed by:* ${currentUser || 'Staff'}

--------------------------------`;

      // 3. Call WhatsApp Cloud API
      const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
      const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
      const GROUP_ID = process.env.WHATSAPP_GROUP_ID;

      if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !GROUP_ID) {
        console.error("Missing WhatsApp configuration");
        return res.status(500).json({ error: "WhatsApp configuration missing on server" });
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: GROUP_ID,
          type: "text",
          text: {
            body: messageText
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("WhatsApp API Error:", result);
        return res.status(response.status).json(result);
      }

      res.json({ success: true, result });
    } catch (error: any) {
      console.error("Server Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sendStockTakeToWhatsApp", async (req, res) => {
    try {
      const { stockTakeId } = req.body;
      if (!stockTakeId) return res.status(400).json({ error: "Stock Take ID required" });

      const stDoc = await db.collection("stockTakes").doc(stockTakeId).get();
      if (!stDoc.exists) return res.status(404).json({ error: "Stock take not found" });

      const st = stDoc.data();
      const formatDate = (val: any) => {
        if (!val) return 'N/A';
        const date = val.toDate ? val.toDate() : new Date(val);
        return date.toLocaleDateString('en-ZA');
      };

      const itemsList = st?.items?.map((item: any) => `• ${item.name}: ${item.quantity} ${item.unit}`).join('\n') || 'No items';

      const messageText = `📦 *Basson Elektries Stock Take*

*Vehicle:* ${st?.vehicleId || 'N/A'}
*Date:* ${formatDate(st?.date)}
*Performed By:* ${st?.performedBy || 'Staff'}

*Inventory List:*
${itemsList}

${st?.notes ? `*Notes:* ${st.notes}` : ''}

--------------------------------`;

      const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
      const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
      const GROUP_ID = process.env.WHATSAPP_GROUP_ID;

      if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !GROUP_ID) {
        return res.status(500).json({ error: "WhatsApp configuration missing" });
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: GROUP_ID,
          type: "text",
          text: { body: messageText }
        }),
      });

      const result = await response.json();
      if (!response.ok) return res.status(response.status).json(result);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discord/notify-bulk", async (req, res) => {
    try {
      const results = {
        jobs: 0,
        invoices: 0,
        quotes: 0,
        staff: 0
      };

      // Helper to send to discord notify endpoint internally
      const notify = async (channel: string, data: any, userEmail?: string) => {
        const titleMap: any = {
           "job-logs": "🔧 Existing Job Log",
           "invoices": "📄 Existing Invoice",
           "quotes": "📊 Existing Quote",
           "time-sheets": "⏰ Existing Shift Record"
        };
        
        let webhookUrl = "";
        let fields: any[] = [];
        let color = 0x3498db;

        if (channel === "job-logs") {
          webhookUrl = process.env.DISCORD_WEBHOOK_JOB_LOGS || "";
          fields = [
            { name: "Client", value: data.clientId || "N/A", inline: true },
            { name: "Category", value: data.category || "N/A", inline: true },
            { name: "Location", value: data.location || "N/A", inline: false }
          ];
        } else if (channel === "invoices") {
          webhookUrl = process.env.DISCORD_WEBHOOK_INVOICES || "";
          color = 0x2ecc71;
          fields = [
            { name: "Invoice #", value: data.documentNumber || "N/A", inline: true },
            { name: "Client", value: data.clientId || "N/A", inline: true },
            { name: "Total", value: `R ${data.total?.toLocaleString() || "0"}`, inline: true }
          ];
        } else if (channel === "quotes") {
          webhookUrl = process.env.DISCORD_WEBHOOK_QUOTES || "";
          color = 0xf1c40f;
          fields = [
            { name: "Quote #", value: data.documentNumber || "N/A", inline: true },
            { name: "Client", value: data.clientId || "N/A", inline: true },
            { name: "Total", value: `R ${data.total?.toLocaleString() || "0"}`, inline: true }
          ];
        } else if (channel === "time-sheets") {
          webhookUrl = process.env.DISCORD_WEBHOOK_TIME_SHEETS || "";
          const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
          const end = data.endTime?.toDate ? data.endTime.toDate() : (data.endTime ? new Date(data.endTime) : null);
          fields = [
            { name: "Staff", value: data.email || "N/A", inline: true },
            { name: "Start", value: start.toLocaleString('en-ZA'), inline: true },
            { name: "End", value: end ? end.toLocaleString('en-ZA') : "Active", inline: true }
          ];
        }

        if (!webhookUrl) return;

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: titleMap[channel] || "Data Export",
              color,
              fields,
              timestamp: new Date().toISOString(),
              footer: { text: "Basson Elektries Data Export" }
            }]
          })
        });
        // Sleep to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      };

      // 1. Export Jobs
      const jobsSnap = await db.collection("jobs").get();
      for (const doc of jobsSnap.docs) {
        await notify("job-logs", doc.data());
        results.jobs++;
      }

      // 2. Export Billing (Invoices & Quotes)
      const quotesSnap = await db.collection("billing").where("type", "==", "QUOTE").get();
      for (const doc of quotesSnap.docs) {
        await notify("quotes", doc.data());
        results.quotes++;
      }

      const invoicesSnap = await db.collection("billing").where("type", "==", "INVOICE").get();
      for (const doc of invoicesSnap.docs) {
        await notify("invoices", doc.data());
        results.invoices++;
      }

      // 3. Export Shift Logs
      const shiftsSnap = await db.collection("shiftLogs").orderBy("startTime", "desc").limit(20).get();
      for (const doc of shiftsSnap.docs) {
        await notify("time-sheets", doc.data());
        results.staff++;
      }

      res.json({ success: true, results });
    } catch (error: any) {
      console.error("Bulk Export Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discord/notify", async (req, res) => {
    try {
      const { channel, data, userEmail } = req.body;
      
      let webhookUrl = "";
      let title = "";
      let color = 0x3498db; // Default blue
      let fields: any[] = [];

      switch (channel) {
        case "job-logs":
          webhookUrl = process.env.DISCORD_WEBHOOK_JOB_LOGS || "";
          title = "🔧 New Job Log";
          color = 0x3498db;
          fields = [
            { name: "Client", value: data.clientId || "N/A", inline: true },
            { name: "Category", value: data.category || "N/A", inline: true },
            { name: "Location", value: data.location || "N/A", inline: false },
            { name: "Description", value: data.description || "N/A", inline: false }
          ];
          break;
        case "invoices":
          webhookUrl = process.env.DISCORD_WEBHOOK_INVOICES || "";
          title = "📄 New Invoice Created";
          color = 0x2ecc71; // Green
          fields = [
            { name: "Invoice #", value: data.documentNumber || "N/A", inline: true },
            { name: "Client", value: data.clientId || "N/A", inline: true },
            { name: "Total", value: `R ${data.total?.toLocaleString() || "0"}`, inline: true }
          ];
          break;
        case "quotes":
          webhookUrl = process.env.DISCORD_WEBHOOK_QUOTES || "";
          title = "📊 New Quote Created";
          color = 0xf1c40f; // Yellow
          fields = [
            { name: "Quote #", value: data.documentNumber || "N/A", inline: true },
            { name: "Client", value: data.clientId || "N/A", inline: true },
            { name: "Total", value: `R ${data.total?.toLocaleString() || "0"}`, inline: true }
          ];
          break;
        case "time-sheets":
          webhookUrl = process.env.DISCORD_WEBHOOK_TIME_SHEETS || "";
          title = data.type === "clock-in" ? "⏰ Clock In" : "⏰ Clock Out";
          color = data.type === "clock-in" ? 0x2ecc71 : 0xe74c3c; // Green for in, Red for out
          fields = [
            { name: "Staff Member", value: userEmail || "N/A", inline: true },
            { name: "Time", value: new Date().toLocaleString('en-ZA'), inline: true }
          ];
          break;
        case "stock-take":
          webhookUrl = process.env.DISCORD_WEBHOOK_STOCK_TAKE || "";
          title = "📦 Stock Take Submitted";
          color = 0x9b59b6; // Purple
          fields = [
            { name: "Vehicle", value: data.vehicleId || "N/A", inline: true },
            { name: "Performed By", value: data.performedBy || userEmail || "N/A", inline: true },
            { name: "Items", value: data.items?.length ? `${data.items.length} items logged` : "No items", inline: true }
          ];
          break;
        default:
          return res.status(400).json({ error: "Invalid channel" });
      }

      if (!webhookUrl) {
        return res.status(500).json({ error: `Webhook URL for ${channel} is not configured` });
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title,
            color,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "Basson Elektries Operations" }
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Discord API Error:", errorText);
        return res.status(response.status).json({ error: errorText });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Discord Notify Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
