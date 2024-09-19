const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const users = require('../models/user'); // Import user model
const pool = require('../config/db'); // Import db
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in the database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );
    
    let user = userResult.rows[0];

    // If the user exists, generate JWT and return the user
    if (user) {
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      console.log(`JWT Token for user ${user.username}: ${token}`);
      
      return done(null, { user, token });  // Pass user and token to done
    }

    //Check if email exists in the Google profile (it should)
    if (!profile.emails || profile.emails.length === 0) {
      return done(new Error("No email found in the Google profile"));
    }
    const email = profile.emails[0].value;

    // If the user doesn't exist, create a new user in the database
    const newUserResult = await pool.query(
      'INSERT INTO users (google_id, username, first_name, last_name, email, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        profile.id, 
        email,                     // username as Google email
        profile.name.givenName,    // first name from Google profile
        profile.name.familyName,    // last name from Google profile
        email,                     // store Google email
        ''                         // password is blank for Google users
      ]
    );

    user = newUserResult.rows[0];

    // Generate JWT for new user
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return done(null, { user, token }); // Pass new user and token to done
  } catch (err) {
    console.error(err);
    return done(err, null);
  }
}));

passport.serializeUser((userData, done) => {
  done(null, userData.user.google_id);  // Serialize using Google ID
});

passport.deserializeUser(async (id, done) => {
  try {
    // Fetch the user from the database by Google ID
    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [id]
    );

    const user = userResult.rows[0];
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});