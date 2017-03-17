const jwt = require('jwt-simple');
const User = require('../models/User');
const Token = require('../models/Token');
const gapi = require('googleapis');
const nodemailer = require('nodemailer');

const encodeJwt = user => {
  const timestamp = (new Date).getTime();

  return jwt.encode({ sub: user._id, iat: timestamp }, process.env.JWT_SECRET_STRING);
};

const generateRandomToken = () => {
  let hash = '';

  for (let i = 0; i < 32; i++) {
    hash += (Math.floor(Math.random() * 16)).toString(16);
  }

  return hash;
}

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
  },

  requestToken(req, res, next) {
    const { email } = req.body;

    if (!email) {
      res.status(422).send({ success: false, error: 'Email must be provided' });
    }

    User.findOne({ email })
      .then(user => {
        if (!user) {
          res.status(401).send({ success: false, error: 'User not found' });
        }

        const otpw = new Token({ user, token: generateRandomToken(), createdAt: new Date() });

        return otpw.save()
      })
      .then(otpw => {
        const { token } = otpw;
        const transport = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: process.env.MAIL_PORT,
          secure: false,
          requireTLS: true,
          name: process.env.MAIL_ADDRESS,
          auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
          }
        });

        var mailOptions = {
          from: process.env.MAIL_ADDRESS,
          to: email,
          subject: "Your One-time Password for React Auth app",
          html: '<html><body><h1>Please access the following link:</h1><p><a href="http://localhost:3000/acceptToken?token=' + token + '">Click here</a></p></body></html>'
        };

        transport.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(500).send({ success: false, error: 'Couldn\'t send mail' });
          }

          console.log(info.message);
          res.status(200).send({ success: true, message: 'Mail sent successfully' });
        });
      });
  },

  acceptToken(req, res, next) {
    const { token } = req.body;

    Token.findOne({ token })
      .populate('user')
      .then(tokenModel => {
        if (!tokenModel) {
          res.status(401).send({ success: false, error: 'This token most likely expired, please try generating a new token.' });
        }

        const { user } = tokenModel;

        return Promise.all([tokenModel.remove(), user]);
      })
      .then(results => {
        const user = results.pop();

        res.status(200).send({ token: encodeJwt(user) });
      })
      .catch(next);
  }
};
