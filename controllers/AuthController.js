const jwt = require('jwt-simple');
const User = require('../models/User');
const gapi = require('googleapis');

const encodeJwt = user => {
  const timestamp = (new Date).getTime();

  return jwt.encode({ sub: user._id, iat: timestamp }, process.env.JWT_SECRET_STRING);
};

module.exports = {
  signup(req, res, next) {
    const { email, password } = req.body;

    if (!email) {
      res.status(422).send({ success: false, error: 'E-mail must be provided' });
    }

    User.findOne({email})
      .then(user => {
        if (user) {
          res.status(422).send({ success: false, error: "E-mail " + email + " is already in use!" });
        }

        const newUser = new User({ email, password });

        return newUser.save();
      })
      .then(user => {
        res.status(200).send({ token: encodeJwt(user) })
      })
      .catch(next);
  },

  signinGoogle(req, res, next) {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(422).send({ success: 'false' , error: 'Couldn\'t receive access token' })
    }

    const { OAuth2 } = gapi.auth;
    const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_CALLBACK_URL } = process.env;
    const oauth2Client = new OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_CALLBACK_URL);

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    gapi.plus('v1').people.get({
      userId: 'me',
      auth: oauth2Client
    }, (err, response) => {
      const email = response.emails[0].value;

      User.findOne({ email })
        .then(user => {
          if (!user) {
            res.status(422).send({ success: false, error: 'User not found' });
          } else {
            res.status(200).send({ token: encodeJwt(user) });
          }
        });
    });
  },

  signin(req, res, next) {
    res.status(200).send({ token: encodeJwt(req.user) });
  }
};
