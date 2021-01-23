const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// Generate Token ///////////////////////////////////////////////////////////////////////////////////////////
const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// Send Token ///////////////////////////////////////////////////////////////////////////////////////////////////
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, // cookie will only be sent on an encrypted connection(https)
    httpOnly: true, // cookie can't be modified by the browser
  };
  cookieOptions.secure =
    req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('jwt', token, cookieOptions);

  // Removes the password from output
  // eslint-disable-next-line no-param-reassign
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
  });
};

// SIGNUP ///////////////////////////////////////////////////////////////////////////////////////////////////
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  // sign(payload, secret, options)
  createSendToken(newUser, 201, req, res);
});

// LOGIN ///////////////////////////////////////////////////////////////////////////////////////////////////
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
  createSendToken(user, 200, req, res);
});

// LOGOUT //////////////////////////////////////////////////////////////////////////////////
exports.logout = catchAsync(async (req, res, next) => {
  // send cookie with same jwt, but without any token(null) and set the expire time in the past
  res.cookie('jwt', 'null', {
    expires: new Date(Date.now() - 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

// PROTECTED ROUTE can only be accessed by LOGGEDIN users ////////////////////////////////////////////////////
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
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  res.locals.user = currentUser; // user--> this variable will be available for every pug templates
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // 1) verify token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }

    // 3) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // THERE IS A LOGGED IN USER
    res.locals.user = currentUser; // user--> this variable will be available for every pug templates
    return next();
  }
  next();
});

// ROUTE RESTRICTION (like delete route can only be accessed by admin) //////////////////////////////////////////
exports.restrictTO = (...roles) =>
  // roles--> REST OPERATOR
  (req, res, next) => {
    // roles--> ['admin', 'lead-guide']  if(role--> 'user') then no permission
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

// FORGOT PASSWORD ///////////////////////////////////////////////////////////////////////////////////////////////////
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with provided email address', 404));
  }

  // 2) Generate the random reset token(not jwt)
  const resetToken = user.createPasswordResetToken(); // original token (not hashed)
  await user.save({ validateBeforeSave: false }); // it will deactivate all the validators specified in our schema

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetpassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There is an error sending the email. Try again later!', 500)
    );
  }
});

// RESET PASSWORD ///////////////////////////////////////////////////////////////////////////////////////////////////
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // user with reqd token and if the token expire time is valid or not

  // 2) If the token is not expired(10 minutes) and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt  property of the user

  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

// UPDATE PASSWORD FOR LOGGEDIN USERS(req.user) ////////////////////////////////////////////////////////////
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed current password is correct
  // bcrypt.compare()
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password  did not match', 401));
  }

  // 3) If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

// INACTIVE USERS ///////////////////////////////////////////////////////////////////////////////////////////////////
exports.inactiveUsers = catchAsync(async (req, res, next) => {
  const users = await User.aggregate([
    {
      $match: { active: { $ne: true } },
    },
  ]);

  res.status(200).json({
    status: 'success',
    length: users.length,
    data: {
      users: users,
    },
  });
});
