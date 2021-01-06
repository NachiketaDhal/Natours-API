const { promisify } = require('util');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');

// Generate Token
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// SIGNUP
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  // sign(payload, secret, options)
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser,
    },
  });
});

// LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
    // next(err)--> goes directly to the global error handler
  }

  // 2) check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password'); // because password: {select: false} in userModel

  // correctPassword is an instance method which will be available in all documents of a certain collection
  // user--> document
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 3) If everything is ok, send token to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

// PROTECTED ROUTE can only be accessed by LOGGEDIN users
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  // Authorization: Bearer {token}
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if user still exists(if deleted from DB or not)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists.', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  // iat--> issued at
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  // GRANT ACCESS TO THE PROTECTED ROUTE
  req.user = currentUser; // storing user to the req
  next();
});

exports.restrictTO = (...roles) => {
  // roles--> REST OPERATOR
  return (req, res, next) => {
    // roles--> ['admin', 'lead-guide']  if(role--> 'user) then no permission
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
