/**
 * Daily Audit Helper Functions
 * Utility functions for the daily audit feature
 */

/**
 * Calculate risk level based on discrepancy amount
 * @param discrepancy - The difference between batch total and system balance
 * @param highRiskThreshold - Configurable threshold for high risk (default: 2000)
 * @returns Risk level: 'low', 'medium', or 'high'
 */
export function getRiskLevel(
  discrepancy: number,
  highRiskThreshold: number = 2000
): "low" | "medium" | "high" {
  const absDiscrepancy = Math.abs(discrepancy);

  if (absDiscrepancy === 0) return "low";
  if (absDiscrepancy > highRiskThreshold) return "high";
  return "medium";
}

/**
 * Check if submission is on time based on daily cutoff
 * @param submissionTime - When the receipt was submitted
 * @param auditDate - The date the receipts are for
 * @param cutoffHour - Daily cutoff hour (24-hour format, default: 20)
 * @param cutoffMinute - Daily cutoff minute (default: 0)
 * @param timezone - Timezone for date calculations (default: 'Africa/Johannesburg')
 * @param gracePeriodMinutes - Grace period after cutoff (default: 30)
 * @returns Object with isOnTime and submissionStatus
 */
export function checkSubmissionTiming(
  submissionTime: Date,
  auditDate: Date,
  cutoffHour: number = 20,
  cutoffMinute: number = 0,
  timezone: string = "Africa/Johannesburg",
  gracePeriodMinutes: number = 30
): { isOnTime: boolean; submissionStatus: string; cutoffTime: Date } {
  // Create cutoff time for the audit date
  const cutoffTime = new Date(auditDate);
  cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);

  // Add grace period
  const gracePeriodEnd = new Date(cutoffTime);
  gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + gracePeriodMinutes);

  const isOnTime = submissionTime <= gracePeriodEnd;

  let submissionStatus: string;
  if (submissionTime <= cutoffTime) {
    submissionStatus = "Submitted";
  } else if (submissionTime <= gracePeriodEnd) {
    submissionStatus = "Submitted Late (Grace Period)";
  } else {
    submissionStatus = "Submitted Late";
  }

  return { isOnTime, submissionStatus, cutoffTime };
}

/**
 * Calculate audit status based on receipt total and system balance
 * @param batchReceiptTotal - Sum of OCR-extracted totals from receipt image
 * @param systemBalance - ASSIT balance for the employee for this day
 * @returns Status string
 */
export function calculateAuditStatus(
  batchReceiptTotal: number | null,
  systemBalance: number | null
): string {
  if (!batchReceiptTotal && !systemBalance) {
    return "Nothing to Submit";
  } else if (batchReceiptTotal && !systemBalance) {
    return "Awaiting System Balance";
  } else if (!batchReceiptTotal && systemBalance) {
    return "Missing Batch Receipt";
  } else {
    const discrepancy = (batchReceiptTotal || 0) - (systemBalance || 0);
    if (discrepancy === 0) return "Balanced";
    else if (discrepancy > 0) return "Over";
    else return "Short";
  }
}

/**
 * Calculate discrepancy amount
 * @param batchReceiptTotal - Sum of OCR-extracted totals from receipt image
 * @param systemBalance - ASSIT balance for the employee for this day
 * @returns Discrepancy amount (positive = over, negative = short)
 */
export function calculateDiscrepancy(
  batchReceiptTotal: number | null,
  systemBalance: number | null
): number {
  if (!batchReceiptTotal || !systemBalance) return 0;
  return batchReceiptTotal - systemBalance;
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'ZAR')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Get status color for UI display
 * @param status - Audit status
 * @returns Color string for Ant Design components
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "balanced":
      return "green";
    case "short":
      return "red";
    case "over":
      return "orange";
    case "awaiting system balance":
      return "blue";
    case "missing batch receipt":
      return "red";
    case "nothing to submit":
      return "default";
    default:
      return "default";
  }
}

/**
 * Get risk level color for UI display
 * @param riskLevel - Risk level
 * @returns Color string for Ant Design components
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case "high":
      return "red";
    case "medium":
      return "orange";
    case "low":
      return "green";
    default:
      return "default";
  }
}

/**
 * Get submission status color for UI display
 * @param status - Submission status
 * @returns Color string for Ant Design components
 */
export function getSubmissionStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "submitted":
      return "green";
    case "submitted late (grace period)":
      return "orange";
    case "submitted late":
      return "red";
    case "not submitted":
      return "red";
    case "nothing to submit":
      return "default";
    default:
      return "default";
  }
}

/**
 * Check if OCR confidence is acceptable
 * @param confidence - OCR confidence score (0-1)
 * @param threshold - Minimum acceptable confidence (default: 0.8)
 * @returns Boolean indicating if confidence is acceptable
 */
export function isOCRConfidenceAcceptable(
  confidence: number,
  threshold: number = 0.8
): boolean {
  return confidence >= threshold;
}

/**
 * Calculate balance rate percentage
 * @param balancedCount - Number of balanced audits
 * @param totalCount - Total number of audits
 * @returns Percentage (0-100)
 */
export function calculateBalanceRate(
  balancedCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((balancedCount / totalCount) * 100);
}

/**
 * Calculate submission rate percentage
 * @param onTimeCount - Number of on-time submissions
 * @param totalCount - Total number of expected submissions
 * @returns Percentage (0-100)
 */
export function calculateSubmissionRate(
  onTimeCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((onTimeCount / totalCount) * 100);
}

/**
 * Check if an employee is a repeat offender
 * @param discrepancyCount - Number of discrepancies in the last 30 days
 * @param lateSubmissionCount - Number of late submissions in the last 30 days
 * @param threshold - Threshold for repeat offender (default: 3)
 * @returns Boolean indicating if employee is a repeat offender
 */
export function isRepeatOffender(
  discrepancyCount: number,
  lateSubmissionCount: number,
  threshold: number = 3
): boolean {
  return discrepancyCount + lateSubmissionCount >= threshold;
}

/**
 * Get week start date for a given date
 * @param date - Date to get week start for
 * @returns Date object representing the start of the week (Monday)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get week end date for a given date
 * @param date - Date to get week end for
 * @returns Date object representing the end of the week (Sunday)
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Validate receipt file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result object
 */
export function validateReceiptFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ["image/jpeg", "image/png", "application/pdf"]
): { isValid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File type not supported. Please upload JPG, PNG, or PDF files.",
    };
  }

  return { isValid: true };
}

/**
 * Default configuration for daily audit feature
 */
export const DAILY_AUDIT_CONFIG = {
  HIGH_RISK_THRESHOLD: 2000,
  REPEAT_OFFENDER_WINDOW_DAYS: 30,
  DATA_RETENTION_DAYS: 2555, // 7 years for audit compliance
  OCR_CONFIDENCE_THRESHOLD: 0.8,
  DAILY_SUBMISSION_CUTOFF_HOUR: 20, // 8:00 PM (24-hour format)
  DAILY_SUBMISSION_CUTOFF_MINUTE: 0,
  TIMEZONE: "Africa/Johannesburg", // SAST timezone
  LATE_SUBMISSION_GRACE_PERIOD_MINUTES: 30, // Grace period after cutoff
  REPEAT_OFFENDER_THRESHOLD: 3, // Number of issues to be considered repeat offender
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "application/pdf"],
} as const; 