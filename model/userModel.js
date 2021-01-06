const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us oyur name'],
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
  photo: String,
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
});

// Mongoose document pre MIDDLEWARE(pre--> because password needs to be hashed before saving to the database)
userSchema.pre('save', async function (next) {
  // Only run this function if the password is modified
  if (!this.isModified('password')) return next();

  // Hash the password with saltround = 12
  this.password = await bcrypt.hash(this.password, 12); // returns promise

  // Delete the passwordConfirm field from Database
  this.passwordConfirm = undefined;
  next();
});

// PASSWORD COMPARISION
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

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  // false means not changed
  return false;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
