const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendPasswordResetEmail = (email, token) => {
  const resetLink = `http://localhost:5000/reset-password/${token}`;
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset, if you did not request a password reset you can safely ignore this email. Click here to reset your password: ${resetLink}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Password reset email sent:', info.response);
    }
  });
};

module.exports = { sendPasswordResetEmail };
