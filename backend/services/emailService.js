import nodemailer from 'nodemailer';

/**
 * Email Service for sending notifications
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        console.log('✅ Email service initialized');
      } else {
        console.log('⚠️  Email service not configured (optional)');
      }
    } catch (error) {
      console.error('Email service initialization error:', error.message);
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      console.log('Email not sent - service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `RailMate <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send complaint submission confirmation
   */
  async sendComplaintConfirmation(userEmail, userName, complaintId, title) {
    const subject = 'Complaint Submitted Successfully - RailMate';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Complaint Submitted Successfully</h2>
        <p>Dear ${userName},</p>
        <p>Your complaint has been received and registered in our system.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Complaint ID:</strong> ${complaintId}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Status:</strong> Pending</p>
        </div>
        
        <p>Our team will review your complaint and take appropriate action. You will receive updates via email as the status changes.</p>
        
        <p>You can track your complaint status by logging into your RailMate account.</p>
        
        <p>Thank you for using RailMate!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send status update notification
   */
  async sendStatusUpdate(userEmail, userName, complaintId, title, oldStatus, newStatus) {
    const subject = `Complaint Status Updated - ${newStatus}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Complaint Status Updated</h2>
        <p>Dear ${userName},</p>
        <p>The status of your complaint has been updated.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Complaint ID:</strong> ${complaintId}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>Current Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus}</span></p>
        </div>
        
        ${
          newStatus === 'Resolved'
            ? '<p style="color: #059669; font-weight: bold;">Your complaint has been resolved! Thank you for your patience.</p>'
            : '<p>We are working on resolving your complaint. You will receive further updates as progress is made.</p>'
        }
        
        <p>You can view full details by logging into your RailMate account.</p>
        
        <p>Thank you for using RailMate!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send complaint assignment notification to staff
   */
  async sendAssignmentNotification(staffEmail, staffName, complaintId, title, category, priority) {
    const subject = 'New Complaint Assigned - RailMate';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Complaint Assigned</h2>
        <p>Dear ${staffName},</p>
        <p>A new complaint has been assigned to you.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Complaint ID:</strong> ${complaintId}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Priority:</strong> <span style="color: ${priority === 'High' || priority === 'Critical' ? '#dc2626' : '#f59e0b'};">${priority}</span></p>
        </div>
        
        <p>Please log in to the RailMate staff portal to view details and take action.</p>
        
        <p>Thank you!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;

    return this.sendEmail(staffEmail, subject, html);
  }
}

export default new EmailService();
