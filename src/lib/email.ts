import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface PasswordResetEmailData {
  to: string;
  name: string;
  newPassword: string;
}

export const sendPasswordResetEmail = async (data: PasswordResetEmailData) => {
  try {
    const { to, name, newPassword } = data;

    const result = await resend.emails.send({
      from: 'SDK Admin Portal <info@somdaka.co.za>',
      to: [to],
      subject: 'Your Password Has Been Reset - SDK Admin Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SDK Admin Portal</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Notification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              An administrator has reset your password for the SDK Admin Portal. Your new temporary password is:
            </p>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <code style="font-size: 18px; font-weight: bold; color: #495057; letter-spacing: 2px;">${newPassword}</code>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              <strong>Important:</strong> For security reasons, you will be required to change this password when you next log in.
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> Please change your password immediately after logging in and do not share this temporary password with anyone.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you did not request this password reset or have any concerns, please contact your system administrator immediately.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              <strong>SDK Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
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

export const sendCancellationRequestEmail = async (data: CancellationRequestEmailData) => {
  try {
    const { to, policyNumber, memberName, reason, cancellationType, effectiveDate, requestId } = data;

    const reasonLabels: { [key: string]: string } = {
      financial_hardship: "Financial Hardship",
      found_better_cover: "Found Better Cover",
      no_longer_needed: "No Longer Needed",
      dissatisfied_service: "Dissatisfied with Service",
      moving_abroad: "Moving Abroad",
      deceased: "Deceased",
      other: "Other"
    };

    const typeLabels: { [key: string]: string } = {
      immediate: "Immediate Cancellation",
      end_of_period: "End of Current Period",
      specific_date: "Specific Date"
    };

    const result = await resend.emails.send({
      from: 'SDK Admin Portal <info@somdaka.co.za>',
      to: [to],
      subject: `Policy Cancellation Request Submitted - ${policyNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SDK Admin Portal</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Policy Cancellation Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
            <h2 style="color: #333; margin-top: 0;">Cancellation Request Submitted</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Your policy cancellation request has been successfully submitted and is currently under review.
            </p>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Policy Number:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${policyNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Member Name:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${memberName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Cancellation Type:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${typeLabels[cancellationType] || cancellationType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Effective Date:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${effectiveDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Reason:</td>
                  <td style="padding: 8px 0; color: #666;">${reasonLabels[reason] || reason}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Request ID:</strong> ${requestId}<br>
                <strong>Status:</strong> Pending Review
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Our team will review your request and contact you within 2-3 business days with the outcome. 
              You will receive another email notification once your request has been processed.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need to provide additional information, please contact our support team.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              <strong>SDK Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending cancellation request email:', error);
    return { success: false, error };
  }
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

export const sendCancellationStatusEmail = async (data: CancellationStatusEmailData) => {
  try {
    const { to, policyNumber, memberName, status, reviewNotes, requestId, effectiveDate } = data;

    const statusColor = status === "approved" ? "#28a745" : "#dc3545";
    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusMessage = status === "approved"
      ? "Your policy cancellation request has been approved and will be processed accordingly."
      : "Your policy cancellation request has been rejected. Please contact us for more information.";

    const result = await resend.emails.send({
      from: 'SDK Admin Portal <info@somdaka.co.za>',
      to: [to],
      subject: `Policy Cancellation Request ${statusText} - ${policyNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SDK Admin Portal</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Policy Cancellation Update</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid ${statusColor};">
            <h2 style="color: #333; margin-top: 0;">Cancellation Request ${statusText}</h2>
            
            <div style="background: ${status === "approved" ? "#d4edda" : "#f8d7da"}; border: 1px solid ${status === "approved" ? "#c3e6cb" : "#f5c6cb"}; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: ${status === "approved" ? "#155724" : "#721c24"}; margin: 0; font-weight: bold;">
                Status: ${statusText.toUpperCase()}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              ${statusMessage}
            </p>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Policy Number:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${policyNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Member Name:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${memberName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Effective Date:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${effectiveDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Request ID:</td>
                  <td style="padding: 8px 0; color: #666;">${requestId}</td>
                </tr>
              </table>
            </div>
            
            ${reviewNotes ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">Review Notes:</h4>
              <p style="color: #856404; margin: 0; line-height: 1.6;">${reviewNotes}</p>
            </div>
            ` : ''}
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions about this decision, please contact our support team.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              <strong>SDK Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending cancellation status email:', error);
    return { success: false, error };
  }
};

export interface DailyActivityReminderEmailData {
  to: string;
  name: string;
  date: string;
  cutoffTime: string;
  branch?: string;
  isFirstReminder: boolean;
}

export const sendDailyActivityReminderEmail = async (data: DailyActivityReminderEmailData) => {
  try {
    const { to, name, date, cutoffTime, branch, isFirstReminder } = data;

    const reminderType = isFirstReminder ? "Reminder" : "Final Reminder";
    const urgencyColor = isFirstReminder ? "#667eea" : "#dc3545";
    const urgencyText = isFirstReminder ? "Please submit your daily activity report" : "URGENT: Your daily activity report is overdue";

    const result = await resend.emails.send({
      from: 'SDK Admin Portal <info@somdaka.co.za>',
      to: [to],
      subject: `${reminderType}: Daily Activity Report - ${date}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SDK Admin Portal</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Daily Activity Report ${reminderType}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid ${urgencyColor};">
            <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
            
            <div style="background: ${isFirstReminder ? "#fff3cd" : "#f8d7da"}; border: 1px solid ${isFirstReminder ? "#ffeaa7" : "#f5c6cb"}; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: ${isFirstReminder ? "#856404" : "#721c24"}; margin: 0; font-weight: bold; font-size: 16px;">
                ${urgencyText}
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              This is a ${reminderType.toLowerCase()} to submit your daily activity report for <strong>${date}</strong>.
            </p>
            
            <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Report Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Date:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Cutoff Time:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #666;">${cutoffTime}</td>
                </tr>
                ${branch ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #495057;">Branch:</td>
                  <td style="padding: 8px 0; color: #666;">${branch}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin-top: 0;">How to Submit Your Report</h4>
              <ol style="color: #0c5460; margin: 0; padding-left: 20px;">
                <li>Log into the SDK Admin Portal</li>
                <li>Navigate to "Daily Activity" in the sidebar</li>
                <li>Click "Submit Report" for today's date</li>
                <li>Fill in your activities and submit</li>
              </ol>
            </div>
            
            ${isFirstReminder ? `
            <p style="color: #666; line-height: 1.6;">
              <strong>Note:</strong> This is your first reminder. If you don't submit your report by the cutoff time, you will receive a final reminder.
            </p>
            ` : `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #721c24; margin: 0; font-weight: bold;">
                ⚠️ This is your final reminder. Please submit your report immediately to avoid compliance issues.
              </p>
            </div>
            `}
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need assistance, please contact your supervisor or the system administrator.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Best regards,<br>
              <strong>SDK Admin Portal Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending daily activity reminder email:', error);
    return { success: false, error };
  }
}; 