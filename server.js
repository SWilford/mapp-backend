const express = require('express');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
require('./config/passport.js'); // Import passport configuration
const jobRoutes = require('./routes/jobs');

const app = express();

//Middleware
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

//Import routes
const userRoutes = require('./routes/user');

//Use routes
app.use('/api/users', userRoutes);

// Authentication routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});