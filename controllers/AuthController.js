const jwt = require('jwt-simple');
const User = require('../models/User');

const encodeJwt = user => {
  const timestamp = (new Date).getTime();

  return jwt.encode({ sub: user._id, iat: timestamp }, process.env.JWT_SECRET_STRING);
};

module.exports = {
  signup(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(422).send({ success: false, error: 'E-mail and password must be provided' });
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

  signin(req, res, next) {
    res.status(200).send({ token: encodeJwt(req.user) });
  }
};
