const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config({ silent: true });

const googleOptions = {
  clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL
};
const googleLoginObject = new GoogleStrategy(googleOptions,
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;

    User.findOne({ email })
      .then(user => {
        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      })
      .catch(error => done(error, false));
  });

// Local Strategy
const localOptions = { usernameField: 'email' };
const localLoginObject = new LocalStrategy(localOptions, (email, password, done) => {
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return done(null, false);
      }

      user.comparePassword(password, (err, isMatch) => {
        if (err) return done(err, false);
        if (!isMatch) return done(null, false);

        return done(null, user);
      });
    })
    .catch(error => done(error, false));
});

// Decode JWT Strategy

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.JWT_SECRET_STRING
};

const jwtLoginObject = new Strategy(jwtOptions, (payload, done) => {
  User.findById(payload.sub)
    .then(user => user ? done(null, user) : done(null, false))
    .catch(error => done(error, false));
});

passport.use(jwtLoginObject);
passport.use(localLoginObject);
passport.use(googleLoginObject);
