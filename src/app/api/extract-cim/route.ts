import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import pdfParse from "pdf-parse";
import { withReplicateRetry } from "@/lib/replicateRetry";

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
Return a JSON object with only these optional fields (use null if not found):
- revenue (number, total revenue/sales)
- reportedEbitda (number, reported or GAAP EBITDA before addbacks)
- addbacks (array of { description: string, amount: number } for each addback line, amounts positive)
- deductions (array of { description: string, amount: number } for adjustments that reduce EBITDA, amounts negative)
- dealName (string, company or deal name if evident)
- industry (string, industry/sector if evident)
Use only information explicitly stated in the text. Do not infer. Return valid JSON only, no markdown or explanation.`;

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
