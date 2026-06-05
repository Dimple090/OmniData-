// server.js - Node/Express Backend Server

import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve static path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// API Endpoint: Send Email via SMTP
app.post('/api/send-email', async (req, res) => {
  const { senderEmail, subject, message } = req.body;

  if (!senderEmail || !subject || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: senderEmail, subject, and message are required.' 
    });
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const isPlaceholderUser = !emailUser || emailUser.includes('your-email') || emailUser.includes('your-actual-email') || emailUser.trim() === '';
  const isPlaceholderPass = !emailPass || emailPass.includes('your-app-password') || emailPass.trim() === '';

  if (isPlaceholderUser || isPlaceholderPass) {
    console.warn('SMTP credentials are not configured in .env file.');
    return res.status(503).json({ 
      success: false, 
      error: 'SMTP service is currently offline. Please configure EMAIL_USER and EMAIL_PASS in your .env file with valid credentials.' 
    });
  }

  try {
    // Configure NodeMailer transporter (using Gmail SMTP or standard custom transport)
    // Note: To use Gmail, user must configure a Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: senderEmail,
      to: emailUser, // Deliver notification to the developer's address
      subject: `[OmniData Client Feedback] ${subject}`,
      text: `Sender: ${senderEmail}\n\nMessage:\n${message}`,
      replyTo: senderEmail
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email successfully sent:', info.messageId);

    return res.json({ 
      success: true, 
      message: 'Your email has been sent successfully!' 
    });
  } catch (error) {
    console.error('SMTP Mailer Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to send email. Details: ${error.message}` 
    });
  }
});

// Wildcard fallback to serve index.html for single page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 OmniData Server running at http://localhost:${PORT}`);
  console.log(`🔒 Secure email sending route configured at /api/send-email`);
  console.log(`========================================================`);
});
