import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

// Register custom Handlebars helpers
Handlebars.registerHelper(
  "formatDate",
  function (date: string | Date, format: string = "DD/MM/YYYY") {
    if (!date) return "";
    const d = new Date(date);
    if (format === "DD/MM/YYYY") {
      return d.toLocaleDateString("en-GB");
    }
    return d.toLocaleDateString();
  }
);

Handlebars.registerHelper("formatCurrency", function (amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
});

Handlebars.registerHelper("formatDateTime", function (date: string | Date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-GB");
});

Handlebars.registerHelper(
  "ifEquals",
  function (this: any, arg1: any, arg2: any, options: any) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  }
);

Handlebars.registerHelper(
  "ifNotEquals",
  function (this: any, arg1: any, arg2: any, options: any) {
    return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
  }
);

// Template cache
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Load and compile a Handlebars template
 */
export const loadTemplate = (
  templateName: string
): HandlebarsTemplateDelegate => {
  // Check cache first
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  try {
    // Load template from file system
    const templatePath = path.join(
      process.cwd(),
      "src",
      "lib",
      "email-templates",
      "templates",
      `${templateName}.hbs`
    );
    const templateContent = fs.readFileSync(templatePath, "utf-8");

    // Compile template
    const compiledTemplate = Handlebars.compile(templateContent);

    // Cache the compiled template
    templateCache.set(templateName, compiledTemplate);

    return compiledTemplate;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found`);
  }
};

/**
 * Render a template with data
 */
export const renderTemplate = (templateName: string, data: any): string => {
  const template = loadTemplate(templateName);
  return template(data);
};

/**
 * Get the base email layout
 */
export const getBaseLayout = (): HandlebarsTemplateDelegate => {
  return loadTemplate("base-layout");
};

/**
 * Available email templates
 */
export const EMAIL_TEMPLATES = {
  // User management
  USER_INVITATION: "user-invitation",
  PASSWORD_RESET: "password-reset",
  WELCOME_EMAIL: "welcome-email",

  // Policy management
  POLICY_SIGNUP_CONFIRMATION: "policy-signup-confirmation",
  POLICY_SIGNUP_STATUS_UPDATE: "policy-signup-status-update",
  POLICY_SIGNUP_ADMIN_NOTIFICATION: "policy-signup-admin-notification",
  POLICY_CANCELLATION_REQUEST: "policy-cancellation-request",
  POLICY_CANCELLATION_STATUS: "policy-cancellation-status",

  // Claims
  CLAIM_SUBMISSION_CONFIRMATION: "claim-submission-confirmation",
  CLAIM_STATUS_UPDATE: "claim-status-update",
  CLAIM_ADMIN_NOTIFICATION: "claim-admin-notification",

  // Daily activity
  DAILY_ACTIVITY_REMINDER: "daily-activity-reminder",
  DAILY_ACTIVITY_COMPLIANCE_SUMMARY: "daily-activity-compliance-summary",
  DAILY_ACTIVITY_LATE_SUBMISSION: "daily-activity-late-submission",

  // Daily audit
  DAILY_AUDIT_SUBMISSION_CONFIRMATION: "daily-audit-submission-confirmation",
  DAILY_AUDIT_DISCREPANCY_ALERT: "daily-audit-discrepancy-alert",
  DAILY_AUDIT_RESOLUTION_UPDATE: "daily-audit-resolution-update",

  // Transaction imports
  TRANSACTION_IMPORT_SUCCESS: "transaction-import-success",
  TRANSACTION_IMPORT_FAILURE: "transaction-import-failure",
  TRANSACTION_SYNC_COMPLETION: "transaction-sync-completion",

  // System notifications
  SYSTEM_ERROR_ALERT: "system-error-alert",
  SYSTEM_MAINTENANCE_NOTICE: "system-maintenance-notice",
} as const;

export type EmailTemplateName =
  (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];
