const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamp');
const mongoose = require('mongoose');

// Get all the reviews || reviews of specific bootcamp
// GET /api/v1/bootcamps/:bootcampId/review, public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const data = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      data,
      length: data.length,
    });
  } else {
    return res.status(200).json(res.paginationAndQueryResults);
  }
});

// Get single reviews, GET /api/v1/review/:reviewId, public
exports.getSingleReview = asyncHandler(async (req, res, next) => {
  const data = await Review.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!data) {
    return next(new ErrorResponse(`No review found`, 404));
  }

  return res.status(200).json({
    success: true,
    data,
  });
});

// Create review for a bootcamp, POST /api/v1/bootcamp/:bootcampId/review, private
exports.createSingleReview = asyncHandler(async (req, res, next) => {
  // Check if bootcamp is none
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(new ErrorResponse(`No bootcamp found`, 404));
  }

  // Check if user already submit a review to a bootcamp
  const review = await Review.findOne({
    bootcamp: req.params.bootcampId,
    user: req.user.id,
  });

  if (review) {
    return next(
      new ErrorResponse(
        `User already submitted a review for this bootcamp`,
        400
      )
    );
  }

  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  // Create a review
  const data = await Review.create(req.body);

  // After create a review, update the bootcamp rating
  const obj = await Review.aggregate([
    {
      $match: { bootcamp: mongoose.Types.ObjectId(req.body.bootcamp) },
    },
    {
      $group: {
        _id: '$bootcamp',
        ratingAvg: { $avg: '$rating' },
      },
    },
  ]);

  try {
    await Bootcamp.findByIdAndUpdate(req.body.bootcamp, {
      ratingAvg: obj[0].ratingAvg,
    });
  } catch (error) {
    console.log(error);
  }

  return res.status(201).json({
    success: true,
    data,
    length: data.length,
  });
});

// Update review for a bootcamp, PATCH /api/v1/review/:reviewId
exports.updateSingleReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.reviewId);

  if (!review) {
    return next(new ErrorResponse(`No review found`, 404));
  }

  // Check the review ownership, 'Admin' role cannot edit the reviews
  if (review.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`You are not authorized to update this review`, 401)
    );
  }

  review = await Review.findByIdAndUpdate(req.params.reviewId, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    data: review,
  });
});

// Delete review for a bootcamp, DELETE /api/v1/review/, private
exports.deleteSingleReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.reviewId);

  if (!review) {
    return next(new ErrorResponse(`No review found`, 404));
  }

  // Check the review ownership, 'Admin' role can delete any reviews
  if (review.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(`You are not authorized to update this review`, 401)
    );
  }

  review = await Review.findByIdAndDelete(req.params.reviewId);

  return res.status(200).json({
    success: true,
    data: {},
  });
});
