const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    minlength: [3, 'User name must have at least 3 characters'],
    maxlength: [28, 'User name must have at most 28 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must have atleast 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE() and SAVE()!!!
      validator: function (val) {
        return this.password === val;
      },
      message: 'Password does not match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Mongoose document pre MIDDLEWARE(pre--> because password needs to be hashed before saving to the database) //////////////
userSchema.pre('save', async function (next) {
  // Only run this function if the password is modified
  if (!this.isModified('password')) return next();

  // Hash the password with saltround = 12
  this.password = await bcrypt.hash(this.password, 12); // returns promise

  // Delete the passwordConfirm field from Database
  this.passwordConfirm = undefined;
  next();
});

// To modify the passwordChangedAt property after password reset ///////////////////////////////////////////////////
userSchema.pre('save', function (next) {
  if (this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // the timestamp is created a little bit late, so we reduced 1 second
  next();
});

// To use the query only on active users /////////////////////////////////////////////////////////////////////////
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// PASSWORD COMPARISION /////////////////////////////////////////////////////////////////////////
// correctPassword is an instance method which will be available in all documents of a certain collection
// this --> current document
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // candidatePassword--> input password
  // userPassword--> hashed password
  return await bcrypt.compare(candidatePassword, userPassword);
};

// To check if the password is changed after receiving token /////////////////////////////////////////////////////////
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  // false means not changed
  return false;
};

// To create password reset token /////////////////////////////////////////////////////////////////////////
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // creates random token

  // hash the reset token--> to store in Database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds

  // return the original(unencrypted) token to the user via email--> resetToken
  // But in our Database store encrypted token--> passwordResetToken
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
