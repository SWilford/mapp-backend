const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const users = require('../models/user'); // Import your user model

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Check if user already exists in the database
  let user = users.find(user => user.googleId === profile.id);
  if (user) {
    return done(null, user);
  }

  // If not, create a new user
  user = { googleId: profile.id, username: profile.displayName };
  users.push(user);
  done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
  const user = users.find(user => user.googleId === id);
  done(null, user);
});
