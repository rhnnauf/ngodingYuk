const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin');

const protectedRoute = require('../middlewares/auth');

const paginationAndQuery = require('../middlewares/paginationAndQuery');

const User = require('../models/User');

// Middlewares
router.use(protectedRoute.protectedRouteAuthorization);
router.use(protectedRoute.roleAuthorization('Admin'));

router.get('/users', paginationAndQuery(User), adminController.getAllUsers);

router.post('/users', adminController.createSingleUser);

router.patch('/users/:userId', adminController.updateSingleUser);

router.delete('/users/:userId', adminController.deleteSingleUser);

module.exports = router;
