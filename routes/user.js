const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('List of users will go here');
});

module.exports = router;

//Post route user registration
const bcrypt = require('bcrypt');
const users = require('../models/user'); // Import the user model
const pool = require('../config/db'); // Import db rules

// POST route for user sign-up
router.post('/signup', async (req, res) => {
  const { username, password, first_name, last_name, email } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to PostgreSQL
    const newUser = await pool.query(
      'INSERT INTO users (username, password, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, hashedPassword, first_name, last_name, email]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



//Post route user log-in 
const jwt = require('jsonwebtoken');

// POST route for user login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch user from the database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Authenticate middleware
const authenticateToken = require('../middleware/auth');
// GET route to get the current user's info (protected)
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'User profile', user: req.user });
});
  
