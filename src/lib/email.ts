import nodemailer from 'nodemailer';

// Nodemailer transporter configuration for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // e.g. mishraclasses@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD, // 16-letter App Password
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials not set. Simulation mode: Verification token generated:", token);
    return { success: true, simulated: true };
  }

  const confirmLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"Mishra Classes" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Confirm your email address - Mishra Classes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Welcome to Mishra Classes!</h2>
          <p>Thank you for registering. Please confirm your email address to complete your account setup.</p>
          <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Confirm Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    
    return { success: true, data: info };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials not set. Simulation mode: Reset token generated:", token);
    return { success: true, simulated: true };
  }

  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"Mishra Classes" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset your password - Mishra Classes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to choose a new password.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Reset Password</a>
          <p style="margin-top: 20px; color: #dc2626; font-size: 14px;"><strong>Note:</strong> This link expires in 1 hour.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    
    return { success: true, data: info };
  } catch (error) {
    console.error("Error sending reset email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials not set. Simulation mode: Welcome email");
    return { success: true, simulated: true };
  }

  const loginLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;

  try {
    const info = await transporter.sendMail({
      from: `"Mishra Classes" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Mishra Classes! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Welcome aboard, ${name}!</h2>
          <p>We are thrilled to have you join <strong>Mishra Classes</strong>. Your account has been successfully set up and verified.</p>
          <p>You can now explore our premium courses, join live classes, and access exclusive study materials to accelerate your learning journey.</p>
          <a href="${loginLink}" style="display: inline-block; padding: 12px 24px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Go to Dashboard</a>
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Happy Learning!<br/>The Mishra Classes Team</p>
        </div>
      `,
    });
    
    return { success: true, data: info };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

export async function sendPurchaseEmail(email: string, name: string, courseName: string, amount: number, orderId: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL credentials not set. Simulation mode: Purchase email");
    return { success: true, simulated: true };
  }

  const invoiceLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/student/invoice/${orderId}`;

  try {
    const info = await transporter.sendMail({
      from: `"Mishra Classes" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Payment Successful - Thank You! 🎓',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Congratulations, ${name}!</h2>
          <p>Your payment was successful. We are excited to inform you that you now have full access to your new course.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Course:</strong> ${courseName}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${amount}</p>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          </div>
          <p>You can view and download your official invoice using the link below:</p>
          <a href="${invoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Download Invoice</a>
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you face any issues, please contact our support team.<br/>The Mishra Classes Team</p>
        </div>
      `,
    });
    
    return { success: true, data: info };
  } catch (error) {
    console.error("Error sending purchase email:", error);
    return { success: false, error };
  }
}
