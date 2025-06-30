import {
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type PDFPageProxy,
  getDocument,
} from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// ✅ Direct static reference
GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

/**
 * Extracts raw text from all pages of a PDF file.
 * @param arrayBuffer - The PDF file as an ArrayBuffer
 * @returns Extracted text
 */
export async function extractTextFromPDF(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page: PDFPageProxy = await pdf.getPage(i);
      const content = await page.getTextContent();

      let lastY: number | null = null;
      let pageText = "";

      for (const item of content.items) {
        if ("str" in item && "transform" in item) {
          const textItem = item as TextItem;
          const y = textItem.transform[5];

          if (lastY !== null && y !== lastY) {
            pageText += "\n";
          }

          pageText += textItem.str;
          lastY = y;
        }
      }

      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (err) {
    console.error("Failed to extract text from PDF:", err);
    throw new Error(
      `PDF text extraction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
