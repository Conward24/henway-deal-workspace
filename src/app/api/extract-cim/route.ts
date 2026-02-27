import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import pdfParse from "pdf-parse";
import { withReplicateRetry } from "@/lib/replicateRetry";

async function extractTextWithOcrSpace(pdfBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) return "";

  try {
    const base64 = pdfBuffer.toString("base64");
    const formData = new FormData();
    formData.append("base64Image", `data:application/pdf;base64,${base64}`);
    formData.append("filetype", "PDF");
    formData.append("language", "eng");
    formData.append("isTable", "true");
    formData.append("scale", "true");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      return "";
    }

    const data = (await res.json()) as {
      ParsedResults?: { ParsedText?: string }[];
    };

    if (Array.isArray(data.ParsedResults) && data.ParsedResults.length > 0) {
      const text = data.ParsedResults.map((r) => r.ParsedText || "").join("\n");
      return text.trim();
    }

    return "";
  } catch {
    return "";
  }
}

export interface ExtractCimResponse {
  revenue?: number;
  reportedEbitda?: number;
  addbacks?: { description: string; amount: number }[];
  deductions?: { description: string; amount: number }[];
  dealName?: string;
  industry?: string;
}

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not set. Add it in .env.local to use CIM extraction." },
      { status: 503 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  let text = "";

  // Support PDF upload via multipart/form-data
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      text = parsed.text?.trim() ?? "";

      // Fallback to OCR for scanned PDFs (no text layer)
      if (!text) {
        const ocrText = await extractTextWithOcrSpace(buffer);
        if (ocrText) {
          text = ocrText;
        }
      }
    }

    // Optional fallback: allow an additional "text" field in the same form
    if (!text) {
      const rawText = formData.get("text");
      if (typeof rawText === "string") {
        text = rawText.trim();
      }
    }
  } else if (contentType.includes("application/json")) {
    let body: { text?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    text = typeof body.text === "string" ? body.text.trim() : "";
  } else {
    return NextResponse.json(
      { error: "Unsupported content type. Use JSON or multipart/form-data." },
      { status: 400 }
    );
  }

  if (!text) {
    return NextResponse.json(
      { error: "Missing or empty text extracted from PDF or provided in body." },
      { status: 400 }
    );
  }

  const systemInstruction = `You are a financial analyst extracting key deal data from a CIM (Confidential Information Memorandum) or financial document excerpt.

These CIMs often follow a middle‑market M&A format similar to Generational Equity memos, with sections such as "Financial Highlights", "FINANCIAL ANALYSIS", "Schedule 1 - Historical (Adjusted) Income Statements", "Schedule 2 - Pro Forma Income Statements", and "Notes & Adjustment Details to Schedule 1".

When these structures are present:
- Treat "Sales" (or "Revenue") in the recast / adjusted historical income statement as total revenue.
- Use the latest fully historical fiscal year (for example 2024) as the basis; do NOT use pro forma / projected years for the extracted values.
- For reportedEbitda, prefer the "EBITDA" line for that latest historical year in the recast/adjusted income statement. If both "EBITDA" and "SDE" (Seller's Discretionary Earnings) are shown, use "EBITDA" for reportedEbitda and ignore SDE.
- Do not double‑count addbacks that are already baked into a single EBITDA number. Only create explicit addbacks when the document separately lists adjustments or footnotes (for example in "Notes & Adjustment Details" or lines that describe removing owner compensation, non‑recurring expenses, or non‑operating items).
- For each such adjustment, decide whether it behaves like an addback (increases normalized earnings) or a deduction (reduces normalized earnings) based on the natural‑language description:
  - Examples of addbacks: adjusting shareholder/owner compensation to fair market, removing discretionary or personal expenses, removing one‑time or non‑operating expenses, reclassifying expenses between cost of sales and operating expenses.
  - Examples of deductions: removing non‑operating income, backing out income from entities that will not be part of the deal, or any adjustment that reduces ongoing earnings.
- When you cannot confidently classify an adjustment as addback vs deduction, omit it instead of guessing.

Return a JSON object with only these optional fields (use null if not found):
- revenue (number, total revenue/sales for the latest full historical year)
- reportedEbitda (number, EBITDA for that same year before applying any new addbacks/deductions you list)
- addbacks (array of { description: string, amount: number } for each adjustment that increases normalized EBITDA; amounts positive)
- deductions (array of { description: string, amount: number } for adjustments that reduce normalized EBITDA; amounts negative)
- dealName (string, company or deal name if evident)
- industry (string, industry/sector if evident)

Use only information explicitly stated in the text. Do not infer or project beyond what is written. Return valid JSON only, no markdown or explanation.`;

  const userPrompt = `Extract deal data from this text:\n\n${text.slice(0, 30000)}`;

  try {
    const replicate = new Replicate({ auth: token });
    const output = await withReplicateRetry(() =>
      replicate.run("google/gemini-2.5-flash", {
        input: {
          prompt: userPrompt,
          system_instruction: systemInstruction,
          max_output_tokens: 2048,
        },
      })
    );

    const raw = Array.isArray(output) ? output.join("") : String(output ?? "");
    let jsonStr = raw.trim();
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    const result: ExtractCimResponse = {};
    if (typeof parsed.revenue === "number") result.revenue = parsed.revenue;
    if (typeof parsed.reportedEbitda === "number") result.reportedEbitda = parsed.reportedEbitda;
    if (Array.isArray(parsed.addbacks)) {
      result.addbacks = parsed.addbacks
        .filter((a: unknown) => a && typeof a === "object" && "description" in a && "amount" in a)
        .map((a: { description: string; amount: number }) => ({
          description: String(a.description ?? ""),
          amount: Number(a.amount) || 0,
        }));
    }
    if (Array.isArray(parsed.deductions)) {
      result.deductions = parsed.deductions
        .filter((d: unknown) => d && typeof d === "object" && "description" in d && "amount" in d)
        .map((d: { description: string; amount: number }) => ({
          description: String(d.description ?? ""),
          amount: Number(d.amount) || 0,
        }));
    }
    if (typeof parsed.dealName === "string" && parsed.dealName) result.dealName = parsed.dealName;
    if (typeof parsed.industry === "string" && parsed.industry) result.industry = parsed.industry;

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Extraction failed", details: message },
      { status: 502 }
    );
  }
}
