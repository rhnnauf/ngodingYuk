const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');

const User = require('../models/User');

// Get all users (admin only), GET /api/v1/admin/users, private
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.paginationAndQueryResults);
});

// Create user (admin only), POST /api/v1/admin/users, private
exports.createSingleUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  // Extract data except password
  const { password, ...data } = user._doc;

  res.status(201).json({
    success: true,
    data,
  });
});

// Update user (admin only), PATCH /api/v1/admin/users, private
exports.updateSingleUser = asyncHandler(async (req, res, next) => {
  const data = await User.findByIdAndUpdate(req.params.userId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

// Delete user (admin only), DELETE /api/v1/admin/users, private
exports.deleteSingleUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.userId);

  res.status(200).json({
    success: true,
    data: {},
  });
});
