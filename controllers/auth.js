const asyncHandler = require('../middlewares/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailJob = require('../utils/emailJob');

// Register user, POST /api/v1/auth/register, Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, role } = req.body;

  // Create user
  const user = await User.create({
    name: name,
    email: email,
    password: req.body.password,
    role: role,
  });

  // Extract data except password
  const { password, ...data } = user._doc;

  res.status(200).json({
    success: true,
    data,
  });
});

// Login user, POST /api/v1/auth/login, public
exports.login = asyncHandler(async (req, res, next) => {
  // Validate email & password
  if (!req.body.email || !req.body.password) {
    return next(
      new ErrorResponse(`Please input a valid email and password`, 400)
    );
  }

  // Find user
  const user = await User.findOne({ email: req.body.email }).select(
    '+password'
  );

  if (!user) {
    return next(new ErrorResponse(`Invalid credentials`, 401));
  }

  // Validate password
  const checkPasswordIsMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!checkPasswordIsMatch) {
    return next(new ErrorResponse(`Invalid credentials`, 401));
  }

  // Exclude the password
  const { password, ...data } = user._doc;

  // Sign jwt
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: process.env.SESSION_EXPIRE,
    }
  );

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production' ? true : false,
  };

  return res.status(200).cookie('token', token, options).json({
    success: true,
    data,
    token,
  });
});

// Logout user, GET /api/v1/auth/logout, private
exports.logout = asyncHandler(async (req, res, next) => {
  res.clearCookie('token');

  res.status(200).json({
    success: true,
    message: 'Logout Successfully',
  });
});

// Get current loggedin user, POST /api/v1/auth/current-loggedin, private
exports.getCurrentLoggedIn = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// Forgot password, POST /api/v1/auth/forgot-password, public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(`No user found with the email: ${req.body.email}`, 404)
    );
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and update the resetPasswordToken field
  const updatedValue = {
    resetPasswordToken: hashResetToken(resetToken),
    resetPasswordExpire: Date.now() + 5 * 60 * 1000,
  };

  const data = await User.findOneAndUpdate(
    { email: req.body.email },
    updatedValue,
    {
      new: true,
    }
  );

  // Create url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a request to: \n\n ${resetUrl}`;

  // Send email
  try {
    await emailJob({
      email: req.body.email,
      subject: 'Password reset token',
      message,
    });
    return res.status(200).json({
      success: true,
      message: 'Email sent',
      data,
    });
  } catch (error) {
    console.log(error);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse(`Email could not be sent`, 404));
  }
});

// Reset password, POST /api/v1/auth/reset-password/:resetToken, public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get the hashed token
  const hashedToken = hashResetToken(req.params.resetToken);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse(`Invalid token`, 400));
  }

  // Set new password
  user.password = req.body.password;

  // Then reset the fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: 'Password successfully been reset',
  });
});

const hashResetToken = (resetToken) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  return hashedToken;
};
