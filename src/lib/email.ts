import { Resend } from "resend";

import { EMAIL_TEMPLATES, renderTemplate } from "./email-templates";

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    return new Resend(key);
  } catch {
    return null;
  }
};

// Base email configuration
const EMAIL_CONFIG = {
  from: "SDK Admin Portal <info@somdaka.co.za>",
  replyTo: "support@somdaka.co.za",
};

/**
 * Generic email sending function
 */
const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: any
) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Email not sent: RESEND_API_KEY not configured");
      return {
        success: false,
        error: new Error("Email service not configured"),
      };
    }

    const html = renderTemplate(templateName, data);

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      subject,
      html,
      replyTo: EMAIL_CONFIG.replyTo,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error sending ${templateName} email:`, error);
    return { success: false, error };
  }
};

// ============================================================================
// USER MANAGEMENT EMAILS
// ============================================================================

export interface UserInvitationEmailData {
  to: string;
  name: string;
  email: string;
  temporaryPassword: string;
  role: string;
  status: string;
}

export const sendUserInvitationEmail = async (
  data: UserInvitationEmailData
) => {
  return sendEmail(
    data.to,
    "Welcome to SDK Admin Portal - Account Created",
    EMAIL_TEMPLATES.USER_INVITATION,
    {
      ...data,
      subject: "Welcome to SDK Admin Portal - Account Created",
      subtitle: "Account Invitation",
    }
  );
};

export interface PasswordResetEmailData {
  to: string;
  name: string;
  newPassword: string;
}

export const sendPasswordResetEmail = async (data: PasswordResetEmailData) => {
  return sendEmail(
    data.to,
    "Your Password Has Been Reset - SDK Admin Portal",
    EMAIL_TEMPLATES.PASSWORD_RESET,
    {
      ...data,
      subject: "Your Password Has Been Reset - SDK Admin Portal",
      subtitle: "Password Reset Notification",
    }
  );
};

// ============================================================================
// POLICY MANAGEMENT EMAILS
// ============================================================================

export interface PolicySignupConfirmationEmailData {
  to: string;
  applicantName: string;
  requestId: string;
  planName: string;
  numberOfDependents: number;
  submittedAt: Date;
  status: string;
  message?: string;
}

export const sendPolicySignupConfirmationEmail = async (
  data: PolicySignupConfirmationEmailData
) => {
  return sendEmail(
    data.to,
    "Policy Signup Request Confirmation",
    EMAIL_TEMPLATES.POLICY_SIGNUP_CONFIRMATION,
    {
      ...data,
      subject: "Policy Signup Request Confirmation",
      subtitle: "Application Received",
    }
  );
};

export interface PolicySignupStatusUpdateEmailData {
  to: string;
  applicantName: string;
  status: "approved" | "rejected" | "pending_info" | string;
  requestId: string;
  planName: string;
  policyNumber?: string;
  effectiveDate?: Date;
  createdBy?: string;
  processedAt?: Date;
  processedBy?: string;
  rejectionReason?: string;
  rejectionNotes?: string;
  requestedInfo?: Array<{ field: string; description: string }>;
  notes?: string;
}

export const sendPolicySignupStatusUpdateEmail = async (
  data: PolicySignupStatusUpdateEmailData
) => {
  const statusText =
    data.status === "approved"
      ? "Approved"
      : data.status === "rejected"
        ? "Rejected"
        : data.status === "pending_info"
          ? "Additional Information Required"
          : data.status;

  return sendEmail(
    data.to,
    `Policy Signup Request ${statusText}`,
    EMAIL_TEMPLATES.POLICY_SIGNUP_STATUS_UPDATE,
    {
      ...data,
      subject: `Policy Signup Request ${statusText}`,
      subtitle: "Application Status Update",
    }
  );
};

export interface PolicySignupAdminNotificationEmailData {
  to: string;
  adminName: string;
  requestId: string;
  applicantName: string;
  planName: string;
  numberOfDependents: number;
  submittedAt: Date;
}

export const sendPolicySignupAdminNotificationEmail = async (
  data: PolicySignupAdminNotificationEmailData
) => {
  return sendEmail(
    data.to,
    "New Policy Signup Request - Action Required",
    EMAIL_TEMPLATES.POLICY_SIGNUP_ADMIN_NOTIFICATION,
    {
      ...data,
      subject: "New Policy Signup Request - Action Required",
      subtitle: "Admin Notification",
    }
  );
};

export interface CancellationRequestEmailData {
  to: string;
  policyNumber: string;
  memberName: string;
  reason: string;
  cancellationType: string;
  effectiveDate: string;
  requestId: string;
}

export const sendCancellationRequestEmail = async (
  data: CancellationRequestEmailData
) => {
  return sendEmail(
    data.to,
    `Policy Cancellation Request Submitted - ${data.policyNumber}`,
    EMAIL_TEMPLATES.POLICY_CANCELLATION_REQUEST,
    {
      ...data,
      subject: `Policy Cancellation Request Submitted - ${data.policyNumber}`,
      subtitle: "Cancellation Request",
    }
  );
};

export interface CancellationStatusEmailData {
  to: string;
  policyNumber: string;
  memberName: string;
  status: "approved" | "rejected";
  reviewNotes?: string;
  requestId: string;
  effectiveDate: string;
}

export const sendCancellationStatusEmail = async (
  data: CancellationStatusEmailData
) => {
  const statusText = data.status === "approved" ? "Approved" : "Rejected";

  return sendEmail(
    data.to,
    `Policy Cancellation Request ${statusText} - ${data.policyNumber}`,
    EMAIL_TEMPLATES.POLICY_CANCELLATION_STATUS,
    {
      ...data,
      subject: `Policy Cancellation Request ${statusText} - ${data.policyNumber}`,
      subtitle: "Cancellation Update",
    }
  );
};

// ============================================================================
// CLAIMS EMAILS
// ============================================================================

export interface ClaimSubmissionConfirmationEmailData {
  to: string;
  claimantName: string;
  claimNumber: string;
  policyNumber: string;
  claimType: string;
  schemeType: string;
  claimAmount?: number;
  reason: string;
  submittedAt: Date;
  status: string;
  societyName?: string;
  documents?: Array<{ name: string }>;
}

export const sendClaimSubmissionConfirmationEmail = async (
  data: ClaimSubmissionConfirmationEmailData
) => {
  return sendEmail(
    data.to,
    "Claim Submission Confirmation",
    EMAIL_TEMPLATES.CLAIM_SUBMISSION_CONFIRMATION,
    {
      ...data,
      subject: "Claim Submission Confirmation",
      subtitle: "Claim Received",
    }
  );
};

export interface ClaimStatusUpdateEmailData {
  to: string;
  claimantName: string;
  claimNumber: string;
  policyNumber: string;
  status: string;
  updatedAt: Date;
  updatedBy: string;
  notes?: string;
}

export const sendClaimStatusUpdateEmail = async (
  data: ClaimStatusUpdateEmailData
) => {
  return sendEmail(
    data.to,
    `Claim Status Update - ${data.claimNumber}`,
    EMAIL_TEMPLATES.CLAIM_STATUS_UPDATE,
    {
      ...data,
      subject: `Claim Status Update - ${data.claimNumber}`,
      subtitle: "Status Update",
    }
  );
};

export interface ClaimAdminNotificationEmailData {
  to: string;
  adminName: string;
  claimNumber: string;
  claimantName: string;
  claimType: string;
  claimAmount?: number;
  submittedAt: Date;
}

export const sendClaimAdminNotificationEmail = async (
  data: ClaimAdminNotificationEmailData
) => {
  return sendEmail(
    data.to,
    "New Claim Submitted - Review Required",
    EMAIL_TEMPLATES.CLAIM_ADMIN_NOTIFICATION,
    {
      ...data,
      subject: "New Claim Submitted - Review Required",
      subtitle: "Admin Notification",
    }
  );
};

// ============================================================================
// DAILY ACTIVITY EMAILS
// ============================================================================

export interface DailyActivityReminderEmailData {
  to: string;
  name: string;
  date: string;
  cutoffTime: string;
  branch?: string;
  isFirstReminder: boolean;
}

export const sendDailyActivityReminderEmail = async (
  data: DailyActivityReminderEmailData
) => {
  const reminderType = data.isFirstReminder ? "Reminder" : "Final Reminder";

  return sendEmail(
    data.to,
    `${reminderType}: Daily Activity Report - ${data.date}`,
    EMAIL_TEMPLATES.DAILY_ACTIVITY_REMINDER,
    {
      ...data,
      subject: `${reminderType}: Daily Activity Report - ${data.date}`,
      subtitle: "Daily Activity Reminder",
    }
  );
};

export interface DailyActivityComplianceSummaryEmailData {
  to: string;
  managerName: string;
  date: string;
  totalUsers: number;
  compliantUsers: number;
  nonCompliantUsers: number;
  complianceRate: number;
  nonCompliantUserList?: Array<{ name: string; email: string }>;
}

export const sendDailyActivityComplianceSummaryEmail = async (
  data: DailyActivityComplianceSummaryEmailData
) => {
  return sendEmail(
    data.to,
    `Daily Activity Compliance Summary - ${data.date}`,
    EMAIL_TEMPLATES.DAILY_ACTIVITY_COMPLIANCE_SUMMARY,
    {
      ...data,
      subject: `Daily Activity Compliance Summary - ${data.date}`,
      subtitle: "Compliance Report",
    }
  );
};

export interface DailyActivityLateSubmissionEmailData {
  to: string;
  name: string;
  date: string;
  submittedAt: Date;
  cutoffTime: string;
  branch?: string;
}

export const sendDailyActivityLateSubmissionEmail = async (
  data: DailyActivityLateSubmissionEmailData
) => {
  return sendEmail(
    data.to,
    `Late Daily Activity Report - ${data.date}`,
    EMAIL_TEMPLATES.DAILY_ACTIVITY_LATE_SUBMISSION,
    {
      ...data,
      subject: `Late Daily Activity Report - ${data.date}`,
      subtitle: "Late Submission Notice",
    }
  );
};

// ============================================================================
// DAILY AUDIT EMAILS
// ============================================================================

export interface DailyAuditSubmissionConfirmationEmailData {
  to: string;
  employeeName: string;
  date: string;
  submittedAt: Date;
  batchReceiptTotal: number;
  systemBalance: number;
  discrepancy: number;
}

export const sendDailyAuditSubmissionConfirmationEmail = async (
  data: DailyAuditSubmissionConfirmationEmailData
) => {
  return sendEmail(
    data.to,
    `Daily Audit Report Submitted - ${data.date}`,
    EMAIL_TEMPLATES.DAILY_AUDIT_SUBMISSION_CONFIRMATION,
    {
      ...data,
      subject: `Daily Audit Report Submitted - ${data.date}`,
      subtitle: "Audit Submission Confirmation",
    }
  );
};

export interface DailyAuditDiscrepancyAlertEmailData {
  to: string;
  managerName: string;
  employeeName: string;
  date: string;
  discrepancy: number;
  batchReceiptTotal: number;
  systemBalance: number;
  riskLevel: string;
}

export const sendDailyAuditDiscrepancyAlertEmail = async (
  data: DailyAuditDiscrepancyAlertEmailData
) => {
  return sendEmail(
    data.to,
    `Daily Audit Discrepancy Alert - ${data.employeeName}`,
    EMAIL_TEMPLATES.DAILY_AUDIT_DISCREPANCY_ALERT,
    {
      ...data,
      subject: `Daily Audit Discrepancy Alert - ${data.employeeName}`,
      subtitle: "Discrepancy Alert",
    }
  );
};

export interface DailyAuditResolutionUpdateEmailData {
  to: string;
  employeeName: string;
  date: string;
  resolvedBy: string;
  resolvedAt: Date;
  resolutionNotes?: string;
  originalDiscrepancy: number;
}

export const sendDailyAuditResolutionUpdateEmail = async (
  data: DailyAuditResolutionUpdateEmailData
) => {
  return sendEmail(
    data.to,
    `Daily Audit Discrepancy Resolved - ${data.date}`,
    EMAIL_TEMPLATES.DAILY_AUDIT_RESOLUTION_UPDATE,
    {
      ...data,
      subject: `Daily Audit Discrepancy Resolved - ${data.date}`,
      subtitle: "Resolution Update",
    }
  );
};

// ============================================================================
// TRANSACTION IMPORT EMAILS
// ============================================================================

export interface TransactionImportSuccessEmailData {
  to: string;
  userName: string;
  importType: string;
  fileName: string;
  totalTransactions: number;
  successfulImports: number;
  failedImports: number;
  importDate: Date;
  processingTime: number;
  importNotes?: string;
  failedTransactions?: Array<{ description: string; reason: string }>;
}

export const sendTransactionImportSuccessEmail = async (
  data: TransactionImportSuccessEmailData
) => {
  return sendEmail(
    data.to,
    "Transaction Import Successful",
    EMAIL_TEMPLATES.TRANSACTION_IMPORT_SUCCESS,
    {
      ...data,
      subject: "Transaction Import Successful",
      subtitle: "Import Success",
    }
  );
};

export interface TransactionImportFailureEmailData {
  to: string;
  userName: string;
  importType: string;
  fileName: string;
  errorMessage: string;
  importDate: Date;
  retryInstructions?: string;
}

export const sendTransactionImportFailureEmail = async (
  data: TransactionImportFailureEmailData
) => {
  return sendEmail(
    data.to,
    "Transaction Import Failed",
    EMAIL_TEMPLATES.TRANSACTION_IMPORT_FAILURE,
    {
      ...data,
      subject: "Transaction Import Failed",
      subtitle: "Import Failure",
    }
  );
};

export interface TransactionSyncCompletionEmailData {
  to: string;
  userName: string;
  syncType: string;
  totalProcessed: number;
  successfulSyncs: number;
  failedSyncs: number;
  syncDate: Date;
  processingTime: number;
}

export const sendTransactionSyncCompletionEmail = async (
  data: TransactionSyncCompletionEmailData
) => {
  return sendEmail(
    data.to,
    "Transaction Sync Completed",
    EMAIL_TEMPLATES.TRANSACTION_SYNC_COMPLETION,
    {
      ...data,
      subject: "Transaction Sync Completed",
      subtitle: "Sync Completion",
    }
  );
};

// ============================================================================
// SYSTEM NOTIFICATION EMAILS
// ============================================================================

export interface SystemErrorAlertEmailData {
  to: string;
  adminName: string;
  errorType: string;
  errorMessage: string;
  errorDetails?: string;
  timestamp: Date;
  affectedModule?: string;
}

export const sendSystemErrorAlertEmail = async (
  data: SystemErrorAlertEmailData
) => {
  return sendEmail(
    data.to,
    "System Error Alert - Action Required",
    EMAIL_TEMPLATES.SYSTEM_ERROR_ALERT,
    {
      ...data,
      subject: "System Error Alert - Action Required",
      subtitle: "System Alert",
    }
  );
};

export interface SystemMaintenanceNoticeEmailData {
  to: string;
  userName: string;
  maintenanceType: string;
  scheduledDate: Date;
  duration: string;
  affectedServices: string[];
  maintenanceNotes?: string;
}

export const sendSystemMaintenanceNoticeEmail = async (
  data: SystemMaintenanceNoticeEmailData
) => {
  return sendEmail(
    data.to,
    "Scheduled System Maintenance Notice",
    EMAIL_TEMPLATES.SYSTEM_MAINTENANCE_NOTICE,
    {
      ...data,
      subject: "Scheduled System Maintenance Notice",
      subtitle: "Maintenance Notice",
    }
  );
};
