const nodemailer = require('nodemailer');

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Bharathi Chit Funds" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bharathi Chit Funds Login Verification',
      text: `Hello Admin,\n\nYour login verification code is:\n\n${otp}\n\nThis code expires in 5 minutes.\n\nRegards,\nBharathi Chit Funds`,
      html: `
        <p>Hello Admin,</p>
        <p>Your login verification code is:</p>
        <h2 style="color: #D4AF37; font-weight: bold;">${otp}</h2>
        <p>This code expires in 5 minutes.</p>
        <p>Regards,<br>Bharathi Chit Funds</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

module.exports = sendOTP;
