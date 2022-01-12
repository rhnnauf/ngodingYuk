const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Update user details, PATCH /api/v1/user/update-user, private
exports.updateUserDetails = asyncHandler(async (req, res, next) => {
  let updatedFields;

  // Check the empty fields
  if (!req.body.name && !req.body.email) {
    return next(new ErrorResponse(`Please enter the name or email`, 400));
  } else if (req.body.name && !req.body.email) {
    updatedFields = {
      name: req.body.name,
      email: req.user.email,
    };
  } else if (!req.body.name && req.body.email) {
    updatedFields = {
      name: req.user.name,
      email: req.body.email,
    };
  }

  // Then update
  const data = await User.findByIdAndUpdate(req.user.id, updatedFields, {
    new: true,
    runValidators: true,
  });

  if (!data) {
    return next(new ErrorResponse(`Invalid user`, 401));
  }

  return res.status(200).json({
    success: true,
    data,
  });
});

// Update password, PATCH /api/v1/user/update-password, private
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.password || !req.body.newPassword) {
    return next(
      new ErrorResponse(`Please input your current password and new password`),
      400
    );
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse(`Invalid user`, 401));
  }

  // Validate password
  const checkPasswordIsMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );

  // Check if the old password match with the password, then update the password with newPassword
  if (!checkPasswordIsMatch) {
    return next(new ErrorResponse(`Invalid password`, 401));
  } else {
    // Validate new password with regex
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (passwordPattern.test(req.body.newPassword)) {
      user.password = req.body.newPassword;
      await user.save();
    } else {
      return next(
        new ErrorResponse(
          `New password must contain one uppercase, one lowercase, and one numeric`,
          400
        )
      );
    }
  }

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
    message: 'Password resetted successfully',
    token,
  });
});
