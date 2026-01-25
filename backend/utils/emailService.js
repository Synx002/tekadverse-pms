const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Tekadverse PMS" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.messageId);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
};

const emailTemplates = {
    taskAssigned: (artistName, taskTitle, projectName, deadline) => `
    <h2>New Task Assigned</h2>
    <p>Hi ${artistName},</p>
    <p>You have been assigned a new task:</p>
    <ul>
      <li><strong>Task:</strong> ${taskTitle}</li>
      <li><strong>Project:</strong> ${projectName}</li>
      <li><strong>Deadline:</strong> ${deadline}</li>
    </ul>
    <p>Please check your dashboard for more details.</p>
  `,

    taskStatusUpdated: (managerName, taskTitle, newStatus, artistName) => `
    <h2>Task Status Updated</h2>
    <p>Hi ${managerName},</p>
    <p>${artistName} has updated the task status:</p>
    <ul>
      <li><strong>Task:</strong> ${taskTitle}</li>
      <li><strong>New Status:</strong> ${newStatus}</li>
    </ul>
  `,

    newComment: (recipientName, commenterName, taskTitle, comment) => `
    <h2>New Comment on Task</h2>
    <p>Hi ${recipientName},</p>
    <p>${commenterName} commented on task "${taskTitle}":</p>
    <blockquote>${comment}</blockquote>
  `,

    deadlineReminder: (artistName, taskTitle, daysLeft) => `
    <h2>Task Deadline Reminder</h2>
    <p>Hi ${artistName},</p>
    <p>Reminder: Task "${taskTitle}" is due in ${daysLeft} days.</p>
    <p>Please ensure you complete it on time.</p>
  `
};

module.exports = { sendEmail, emailTemplates };