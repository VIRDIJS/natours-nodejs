// ******/REQUIRE DECLARATIONS/*******
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  // Remove password from output
  // user.password = undefined; // Instructor's method
  // Using instance method userSchema.methods.toJSON instead
  res.status(statusCode).json({
    status: 'Success!',
    token,
    data: {
      user,
    },
  });
};

// ******/REQUEST HANDLERS/*******
// Request handler for POST request at /api/v1/users/signup endpoint
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

// Request handler for POST request at /api/v1/users/login endpoint
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Email and Password are required to Login', 400));
  }
  // 2. Check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.comparePasswords(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3. Everything OK. Send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin','lead-guide'], role='user'
    // req.user below comes from the exports.protect middleware req.user = currentUser
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get the user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('We could not find a user with this email address', 404)
    );
  }
  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // Save the user since we modified the passwordResetExpires field
  await user.save({ validateBeforeSave: false });
  // const message = `Forgot your password? Submit a PATCH request with a new password and passwordConfirm to
  // ${resetURL}\nIf you did not forget your password then please ignore this email.`;

  try {
    // 3. Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 minutes)',
    //   message: message,
    // });
    new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'Success!',
      message: 'Password reset email sent.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try back later.', 500)
    );
  }
  // next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If the token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is either invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. Update the changedPasswordAt property for the current user

  // 4. Log the user in using JWT.
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('Could not find user!', 404));
  }
  // 2. Check if the POSTed current password is correct
  if (!(await user.comparePasswords(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError(
        'Password does not match with the stored password. Please try again',
        400
      )
    );
  }
  // 3. If so update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  // 4. Log the user in with JWT
  createSendToken(user, 200, res);
  // next();
});

// ******/MIDDLEWARE/*******

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get Token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    next(new AppError('Access Denied! Please login.', 401));
  }
  // 2. Validate (Verify) Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3. Check if the user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'Access Denied! The bearer of this token no longer exists.',
        401
      )
    );
  }
  // 4. Check if user changed password after the token was issued.
  const recentChanged = await currentUser.changedPasswordAfter(decoded.iat);
  if (recentChanged) {
    return next(
      new AppError(
        'Access Denied! Password recently changed! Please login again!',
        401
      )
    );
  }
  // 5. Grant access to the protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages. No errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1. Get Token
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3. Check if the user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4. Check if user changed password after the token was issued.
      const recentChanged = await currentUser.changedPasswordAfter(decoded.iat);
      if (recentChanged) {
        return next();
      }
      // There is a logged in user
      res.locals.user = currentUser; // This allows the user to be available in the templates
      return next();
    }
  } catch (err) {
    return next();
  }
  next(); // If no cookie there is no logged-in user so call next() right away.
};
