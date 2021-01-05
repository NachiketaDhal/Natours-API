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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must have atleast 8 characters'],
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

const User = mongoose.model('User', userSchema);

module.exports = User;
