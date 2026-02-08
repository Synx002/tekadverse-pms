const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports (587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Additional options for better reliability
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000, // 1 second
  rateLimit: 5 // Max 5 emails per second
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

/**
 * Send email using configured transporter
 * @param {string|string[]} to - Recipient email address(es)
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {object} options - Additional options (cc, bcc, attachments, etc.)
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, subject, html, options = {}) => {
  try {
    const mailOptions = {
      from: `"Tekadverse PMS" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...options // Allow additional options like cc, bcc, attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', {
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      error: error.message
    });
    return { success: false, error: error.message };
  }
};

// Base HTML template wrapper for consistent styling
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tekadverse PMS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Tekadverse PMS</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                                <strong>Tekadverse PMS</strong><br>
                                Production Management System
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Tekadverse. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Button component
const emailButton = (url, text, color = '#2563eb') => `
<div style="text-align: center; margin: 30px 0;">
    <a href="${url}" style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
        ${text}
    </a>
</div>
`;

// Info box component
const infoBox = (items) => `
<div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 6px;">
    ${items.map(item => `
        <p style="margin: 8px 0; font-size: 14px; color: #374151;">
            <strong style="color: #1f2937;">${item.label}:</strong> ${item.value}
        </p>
    `).join('')}
</div>
`;

const emailTemplates = {
  taskAssigned: (artistName, taskTitle, projectName, deadline, taskUrl = '#') => emailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">New Task Assigned 📋</h2>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi <strong>${artistName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        You have been assigned a new task. Please review the details below:
    </p>
    ${infoBox([
    { label: 'Task', value: taskTitle },
    { label: 'Project', value: projectName },
    { label: 'Deadline', value: deadline }
  ])}
    ${emailButton(taskUrl, 'View Task Details')}
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        Please check your dashboard for more details and start working on this task.
    </p>
  `),

  // taskStatusUpdated: (managerName, taskTitle, newStatus, artistName, taskUrl = '#') => emailWrapper(`
  //   <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">Task Status Updated ✅</h2>
  //   <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  //       Hi <strong>${managerName}</strong>,
  //   </p>
  //   <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  //       <strong>${artistName}</strong> has updated the task status:
  //   </p>
  //   ${infoBox([
  //   { label: 'Task', value: taskTitle },
  //   { label: 'New Status', value: `<span style="display: inline-block; padding: 4px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 13px; font-weight: 600;">${newStatus}</span>` }
  // ])}
  //   ${emailButton(taskUrl, 'View Task')}
  // `),

  newComment: (recipientName, commenterName, taskTitle, comment, taskUrl = '#') => emailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">New Comment 💬</h2>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi <strong>${recipientName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        <strong>${commenterName}</strong> commented on task "<em>${taskTitle}</em>":
    </p>
    <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; font-style: italic;">
            "${comment}"
        </p>
    </div>
    ${emailButton(taskUrl, 'View & Reply')}
  `),

  deadlineReminder: (artistName, taskTitle, daysLeft, taskUrl = '#') => {
    const urgencyColor = daysLeft <= 1 ? '#dc2626' : daysLeft <= 3 ? '#f59e0b' : '#2563eb';
    const urgencyIcon = daysLeft <= 1 ? '⚠️' : daysLeft <= 3 ? '⏰' : '📅';

    return emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: ${urgencyColor}; font-size: 22px;">Task Deadline Reminder ${urgencyIcon}</h2>
      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
          Hi <strong>${artistName}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
          This is a reminder that your task is due soon:
      </p>
      ${infoBox([
      { label: 'Task', value: taskTitle },
      { label: 'Time Remaining', value: `<strong style="color: ${urgencyColor};">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>` }
    ])}
      <div style="background-color: ${urgencyColor}15; border: 1px solid ${urgencyColor}; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; color: ${urgencyColor}; font-size: 14px; font-weight: 600;">
              ${daysLeft <= 1 ? 'Urgent: Please complete this task as soon as possible!' : 'Please ensure you complete this task on time.'}
          </p>
      </div>
      ${emailButton(taskUrl, 'View Task', urgencyColor)}
    `);
  },

  forgotPassword: (userName, resetUrl) => emailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">Reset Your Password 🔑</h2>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi${userName ? ` <strong>${userName}</strong>` : ''},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        You are receiving this email because you (or someone else) have requested a password reset for your account.
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Please click the button below to reset your password:
    </p>
    ${emailButton(resetUrl, 'Reset Password')}
    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
            ⚠️ Security Notice
        </p>
        <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
            If you did not request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
        <strong>Note:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
    </p>
  `),

  welcomeUser: (userName, loginUrl) => emailWrapper(`
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">Welcome to Tekadverse PMS! 🎉</h2>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi <strong>${userName}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        Welcome aboard! Your account has been successfully created.
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        You can now log in and start managing your projects efficiently.
    </p>
    ${emailButton(loginUrl, 'Go to Dashboard', '#10b981')}
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If you have any questions, feel free to reach out to our support team.
    </p>
  `)
};

module.exports = {
  sendEmail,
  emailTemplates,
  transporter // Export for testing purposes
};