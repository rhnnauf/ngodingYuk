const express = require('express');

const reviewController = require('../controllers/review');

const router = express.Router({ mergeParams: true });

const Review = require('../models/Review');

const paginationAndQueryResults = require('../middlewares/paginationAndQuery');

const protectedRoute = require('../middlewares/auth');

router.get(
  '/',
  paginationAndQueryResults(Review, {
    path: 'bootcamp',
    select: 'name description',
  }),
  reviewController.getReviews
);

router.post(
  '/',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('User'),
  reviewController.createSingleReview
);

router.get('/:reviewId', reviewController.getSingleReview);

router.patch(
  '/:reviewId',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('User'),
  reviewController.updateSingleReview
);

router.delete(
  '/:reviewId',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('User', 'Admin'),
  reviewController.deleteSingleReview
);

module.exports = router;
