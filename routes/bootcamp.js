const express = require('express');

const router = express.Router();

const paginationAndQuery = require('../middlewares/paginationAndQuery');

const protectedRoute = require('../middlewares/auth');

const Bootcamp = require('../models/Bootcamp');

// Controller
const bootcampController = require('../controllers/bootcamp');

// Re-route into other routers
const courseRouter = require('../routes/course');

const reviewRouter = require('../routes/review');

router.use('/:bootcampId/course', courseRouter);

router.use('/:bootcampId/review', reviewRouter);

// Router
router.get(
  '/',
  paginationAndQuery(Bootcamp, 'courses'),
  bootcampController.getBootcamps
);

router.get('/:id', bootcampController.getBootcamp);

router.post(
  '/',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  bootcampController.createBootcamp
);

router.put(
  '/:id',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  bootcampController.updateBootcamp
);

router.put(
  '/:id/photo',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  bootcampController.uploadPhotoBootcamp
);

router.delete(
  '/:id',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  bootcampController.deleteBootcamp
);

router.get(
  '/radius/:zipcode/:distance',
  bootcampController.getBootcampsWithinRadius
);

module.exports = router;
