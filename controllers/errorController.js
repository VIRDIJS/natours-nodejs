const AppError = require('../utils/appError');

const handleCastErrorDb = (error) => {
  const message = `Invalid ${error.path} with ${error.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDb = (error) => {
  // Instructor Solution with regex to find text within quotes
  // const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  // My solution
  const value = error.keyValue.name;
  // console.log(value);
  const message = `Duplicate field value: '${value}'. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError('Access Denied: Invalid token. Please login again.', 401);
const handleTokenExpiredError = () =>
  new AppError('Access Denied: Expired JWT Token. Please login again!', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Rendered website
    console.log('Error', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A. API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming errors or other unknown errors: Don't leak to client
    } else {
      //   1.log error
      console.log('Error', err);
      // 2. send generic error
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  } else {
    // B. WEBSITE
    // Operational, trusted error: send to client
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something Went Wrong!',
        msg: err.message,
      });
      // Programming errors or other unknown errors: Don't leak to client
    } else {
      //   1.log error
      console.log('Error', err);
      // 2. send generic error
      return res.status(err.statusCode).render('error', {
        title: 'Something Went Wrong!',
        msg: 'Please try again later',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = Object.create(err);
    let error = Object.assign(err);
    // let error = {...err};
    // error.message = err.message

    if (error.name === 'CastError') {
      error = handleCastErrorDb(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldDb(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDb(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJwtError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }
    // console.log(error.message);
    // console.log(err.message);
    sendErrorProd(error, req, res);
  }

  // next();
};
