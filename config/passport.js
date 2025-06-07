const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
    passReqToCallback: true,
    accessType: 'offline',  // Add this
    prompt: 'consent',      
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile received:', profile);
      
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        console.log('Creating new user for:', profile.emails[0].value);
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          accessToken,
          refreshToken:refreshToken || null
        });
        await user.save();
      } else {
        console.log('Updating existing user:', user.email);
        user.accessToken = accessToken;
      if (refreshToken) {
        user.refreshToken = refreshToken;
      }
      user.tokenInvalid = false;
      await user.save();
      return done(null, user);
      }

      done(null, user);
    } catch (error) {
      console.error('Passport strategy error:', error);
      done(error, null);
    }
  }
));