const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');

const User = require('../models/User');

// Protecting routes
exports.protectedRouteAuthorization = asyncHandler(async (req, res, next) => {
  let token;

  // Naming convention of token, Bearer asdfg1234
  // Split the token into an array ['Bearer', 'asdfg1234']

  // Check if the token included on the headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check if the token included on the cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Request unauthorized', 401));
  }

  try {
    // Verify the token
    const decrypted = jwt.verify(token, process.env.SECRET_KEY);

    req.user = await User.findById(decrypted.id);

    next();
  } catch (error) {
    return next(new ErrorResponse('Request unauthorized', 401));
  }
});

// Role Auth
exports.roleAuthorization = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
