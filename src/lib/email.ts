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