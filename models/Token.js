const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.Promise = Promise;

const TokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    expires: 60 * 15
  }
});

const Token = mongoose.model('token', TokenSchema);

module.exports = Token;
