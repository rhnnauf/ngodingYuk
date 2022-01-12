const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth');

const protectedRoute = require('../middlewares/auth');

router.post('/register', authController.register);

router.post('/login', authController.login);

router.get(
  '/logout',
  protectedRoute.protectedRouteAuthorization,
  authController.logout
);

router.get(
  '/current-loggedin',
  protectedRoute.protectedRouteAuthorization,
  authController.getCurrentLoggedIn
);

router.post('/forgot-password', authController.forgotPassword);

router.put('/reset-password/:resetToken', authController.resetPassword);

module.exports = router;
