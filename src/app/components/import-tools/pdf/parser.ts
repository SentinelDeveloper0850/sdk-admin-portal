
/**
 * Extracts raw text from all pages of a PDF file.
 * @param arrayBuffer - The PDF file as an ArrayBuffer
 * @returns Extracted text
 */
export async function extractTextFromPDF(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  try {
    // Dynamically import pdfjs-dist only on client
    const pdfjs = await import("pdfjs-dist");
    const { GlobalWorkerOptions, getDocument } = pdfjs;
    GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      let lastY: number | null = null;
      let pageText = "";

      for (const item of content.items) {
        if ("str" in item && "transform" in item) {
          const textItem = item as any;
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
