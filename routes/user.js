const express = require('express');

const router = express.Router();

const userController = require('../controllers/user');

const protectedRoute = require('../middlewares/auth');

// Update user details
router.patch(
  '/update-user',
  protectedRoute.protectedRouteAuthorization,
  userController.updateUserDetails
);

// Update user password
router.patch(
  '/update-password',
  protectedRoute.protectedRouteAuthorization,
  userController.updateUserPassword
);

module.exports = router;
