const AuthController = require('../controllers/AuthController');
const passportService = require('../services/passport');
const passport = require('passport');

const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });


module.exports = app => {

  app.get('/', requireAuth, (req, res) => res.send('hello authenticated world!'));
  app.post('/signup', AuthController.signup);
  app.post('/signin', requireSignin, AuthController.signin);
  app.post('/signin/google', AuthController.signinGoogle);

  app.get('/auth/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'], session: false }));
  app.get('/auth/google/callback', passport.authenticate('google', { session: false }),
    AuthController.signin);
};
