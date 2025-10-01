import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Check if it's a multipart form data (file upload) or JSON
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload with OCR processing
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const date = formData.get("date") as string;

      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided" },
          { status: 400 }
        );
      }

      // Simulate OCR processing
      // In a real implementation, you would:
      // 1. Upload file to Cloudinary
      // 2. Process OCR using a service like Google Vision API or Tesseract
      // 3. Extract totals from the receipt

      const mockOcrResult = {
        extractedTotal: Math.floor(Math.random() * 10000) + 1000, // Random amount between 1000-11000
        confidence: 0.85 + Math.random() * 0.15, // Random confidence between 0.85-1.0
        processingTime: Math.floor(Math.random() * 2000) + 500, // Random processing time
      };

      return NextResponse.json({
        success: true,
        message: "File uploaded and processed successfully",
        extractedTotal: mockOcrResult.extractedTotal,
        confidence: mockOcrResult.confidence,
        processingTime: mockOcrResult.processingTime,
        fileUrl: "https://example.com/uploaded-receipt.jpg", // Mock Cloudinary URL
      });
    } else {
      // Handle JSON submission (final submission with confirmed total)
      const body = await request.json();

      // Validate required fields
      if (!body.date || !body.batchReceiptTotal) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      // In a real implementation, you would:
      // 1. Save the cash up submission record to database
      // 2. Calculate status and risk level
      // 3. Send notifications if needed

      const newCashUpSubmission = {
        _id: Date.now().toString(),
        date: body.date,
        employeeId: body.employeeId || "current-user-id",
        employeeName: body.employeeName || "Current User",
        batchReceiptTotal: body.batchReceiptTotal,
        systemBalance: null, // Will be set when system balance is uploaded
        discrepancy: 0,
        status: "Awaiting System Balance",
        submissionStatus: "Submitted",
        riskLevel: "low",
        submittedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        isResolved: false,
        notes: body.notes || null,
        resolutionNotes: null,
        attachments: body.attachments || [],
        ocrResult: body.ocrResult || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: "Receipts submitted successfully",
        cashUpSubmission: newCashUpSubmission,
      });
    }
  } catch (error) {
    console.error("Error processing receipt upload:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process receipt upload" },
      { status: 500 }
    );
  }
} 