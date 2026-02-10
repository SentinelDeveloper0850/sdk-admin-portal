import { deleteReceiptFromSubmission } from "@/server/actions/cash-up-submission.action";
import { NextRequest } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { submissionId, receiptId } = body;
        console.log("🚀 ~ POST ~ receiptId:", receiptId)
        console.log("🚀 ~ POST ~ submissionId:", submissionId)
        if (!submissionId || !receiptId) {
            return new Response(
                JSON.stringify({ success: false, message: "Missing required fields" }),
                { status: 400 }
            );
        }
        const response = await deleteReceiptFromSubmission(submissionId, receiptId);
        console.log("🚀 ~ POST ~ deleteReceiptFromSubmission:", deleteReceiptFromSubmission)
        if (response.success) {
            return new Response(
                JSON.stringify({ success: true, message: response.message }),
                { status: 200 }
            );
        } else {
            return new Response(
                JSON.stringify({ success: false, message: response.message }),
                { status: 500 }
            );
        }
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, message: "Internal server error" }),
            { status: 500 }
        );
    }
}
