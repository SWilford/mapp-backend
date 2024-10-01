const express = require('express');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
require('./config/passport.js'); // Import passport configuration
const jobRoutes = require('./routes/jobs');
const nodemailer = require('nodemailer');
const pool = require('./config/db'); // Import db
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/jobs', jobRoutes);

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));
  
// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

const userRoutes = require('./routes/user');

app.use('/api/users', userRoutes);

// Nodemailer transporter setup for sending emails
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Authentication routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
  app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('/');
  });
  
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
  
  app.get('/current_user', (req, res) => {
    res.send(req.user);
});

app.get('/',(req,res) => {
    res.send('Test')
});

//Forgot password (Send reset link) route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a reset token (valid for 15 minutes)
    const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });

    console.log('Generated reset token:', resetToken);

    // Store the reset token in the database
    await pool.query('UPDATE users SET reset_token = $1 WHERE email = $2', [resetToken, email]);

    // Send password reset email
    // Will need to pass the token along through the reset link somehow, but that is for another time
    const resetLink = `http://localhost:5000/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset, if you did not request a password reset you can safely ignore this email. Click here to reset your password: ${resetLink}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        return res.json({ message: 'Password reset email sent' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
});

//Reset password route
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Verify the reset token
    //const decoded = jwt.verify(token, process.env.JWT_SECRET);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (err) {
      console.error('Error verifying token:', err);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Find the user by the reset token
    const userResult = await pool.query('SELECT * FROM users WHERE reset_token = $1', [token]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database and clear the reset token
    await pool.query('UPDATE users SET password = $1, reset_token = null WHERE id = $2', [hashedPassword, user.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// POST route to handle forgot username requests
app.post('/forgot-username', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email exists in the database
    const result = await pool.query('SELECT username FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const username = result.rows[0].username;

    console.log("Username: " + username)
    console.log("Email: " + email)

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'YardShare Username',
      text: `Your username is: ${username}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email', error });
      }

      return res.json({ message: 'Username sent to your email' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});