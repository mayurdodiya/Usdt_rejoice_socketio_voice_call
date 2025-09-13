const logger = require("../config/logger");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com", // Use your mail server (e.g., Gmail, Mailtrap, etc.)
  port: process.env.MAIL_PORT || 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.MAIL_USER, // your email (or username for SMTP)
    pass: process.env.MAIL_PASS, // your email password or app-specific password
  },
});

// Send email with nodemailer
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error("Error sending email via Nodemailer:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
