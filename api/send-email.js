import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers so the function can be called from different origins if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

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
    console.warn('SMTP credentials are not configured in Vercel Environment Variables.');
    return res.status(503).json({ 
      success: false, 
      error: 'SMTP service is currently offline. Please configure EMAIL_USER and EMAIL_PASS in your Vercel project settings.' 
    });
  }

  try {
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
}
