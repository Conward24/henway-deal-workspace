declare module "pdf-parse" {
  export interface PDFParseResult {
    text: string;
  }

  export default function pdfParse(
    data: Buffer | Uint8Array | ArrayBuffer,
    options?: unknown
  ): Promise<PDFParseResult>;
}

