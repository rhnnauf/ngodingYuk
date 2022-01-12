const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

// Get all courses also can get courses from specified bootcamp
// GET /api/v1/course || /api/v1/bootcamp/:bootcampId/course, public
exports.getAllCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const data = await Course.find({ bootcamp: req.params.bootcampId });
    console.log('here');
    return res.status(200).json({
      success: true,
      data,
      length: data.length,
    });
  } else {
    res.status(200).json(res.paginationAndQueryResults);
  }
});

// Get a course, GET /api/v1/course/courseId, public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const data = await Course.findById(req.params.courseId).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  !data
    ? next(
        new ErrorResponse(
          `Course not found with id of ${req.params.courseId}`,
          404
        )
      )
    : res.status(200).json({
        success: true,
        data,
        length: data.length,
      });
});

// Add a course, POST /api/v1/bootcamp/:bootcampId/course, private
exports.createCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;

  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with the id of ${req.params.bootcampId}`,
        404
      )
    );
  }

  // Check the ownership/publisher of the bootcamp, admin can update anything
  if (req.user.id !== bootcamp.user.toString() && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `User is not authorized to create a course to this bootcamp`,
        401
      )
    );
  }

  const data = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data,
  });
});

// Update a course, PUT /api/v1/course/:courseId, private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  if (req.body.bootcamp) {
    delete req.body.bootcamp;
  }

  let data = await Course.findById(req.params.courseId);

  if (!data) {
    return next(
      new ErrorResponse(
        `Course not found with id of ${req.params.courseId}`,
        404
      )
    );
  }

  // Check the ownership/publisher of the bootcamp, admin can update anything
  if (req.user.id !== data.user.toString() && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `User is not authorized to update a course of this bootcamp`,
        401
      )
    );
  }

  data = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

// Delete a course, DELETE /api/v1/course/:courseId, private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const data = await Course.findById(req.params.courseId);

  if (!data) {
    return next(
      new ErrorResponse(
        `Course not found with id of ${req.params.courseId}`,
        404
      )
    );
  }

  // Check the ownership/publisher of the bootcamp, admin can update anything
  if (req.user.id !== data.user.toString() && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `User is not authorized to delete a course of this bootcamp`,
        401
      )
    );
  }

  await data.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
