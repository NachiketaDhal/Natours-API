const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue); // coverts the object to array of values(from key-value pairs)
  const message = `Duplicate field value: ${value[0]}. Please use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`; // separate the sentences with '. '
  // const message = err.message;
  return new AppError(message, 404);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational error, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.log('ERROR: ', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

// GLOBAL ERROR HANDLING MIDLEWARE
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // console.log(JSON.stringify(err));
    error.name = err.name;
    // To make isOperational = true in required cases
    if (error.name === 'CastError') error = handleCastErrorDB(error); // undefined ID
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // to handle duplicate values
    if (error._message === 'Tour validation failed')
      error = handleValidationErrorDB(error); // to handle validation error

    sendErrorProd(error, res);

    // sendErrorProd(error, res);
  }
};
