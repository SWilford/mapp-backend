const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('List of users will go here');
});

module.exports = router;

//Post route user registration
const bcrypt = require('bcrypt');
const users = require('../models/user'); // Import the user model

// POST route for user sign-up
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Check if the user already exists
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store the new user (we will use a database later)
    const newUser = { username, password: hashedPassword };
    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error during registration' });
  }
});



//Post route user log-in 
const jwt = require('jsonwebtoken');

// POST route for user login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find the user
  const user = users.find(user => user.username === username);
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  try {
    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
});

//Authenticate middleware
const authenticateToken = require('../middleware/auth');
// GET route to get the current user's info (protected)
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'User profile', user: req.user });
});
  
