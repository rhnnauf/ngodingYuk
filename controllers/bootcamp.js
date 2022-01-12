const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const geocoder = require('../utils/geocoder');
const path = require('path');

// Get all bootcamps, GET /api/v1/bootcamp, public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  const data = await Bootcamp.find();

  res.status(200).json(res.paginationAndQueryResults);
});

// Get bootcamp by id, GET /api/v1/bootcamp/:id, public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const data = await Bootcamp.findById(req.params.id);
  !data
    ? next(
        new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
      )
    : res.status(200).json({
        success: true,
        data,
        length: data.length,
      });
});

// Create a new bootcamp, POST /api/v1/bootcamp/:id, private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // Add user to the req.body
  req.body.user = req.user._id;

  // If user role is not admin, check if user has already published a bootcamp
  if (req.user.role !== 'admin') {
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user._id });
    if (publishedBootcamp) {
      return next(
        new ErrorResponse(`User has already published a bootcamp`, 400)
      );
    }
  }

  const data = await Bootcamp.create(req.body);

  res.status(201).json({
    success: true,
    data,
  });
});

// Update a bootcamp by id, PUT /api/v1/bootcamp/:id, private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let data = await Bootcamp.findById(req.params.id);

  // Check if bootcamp exist
  if (!data) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Check the ownership/publisher of the bootcamp, admin can update anything
  if (req.user.id !== data.user.toString() && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(`User is not authorized to update this bootcamp`, 401)
    );
  }

  data = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

// Delete a bootcamp by id, DELETE /api/v1/bootcamp/:id, private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const data = await Bootcamp.findById(req.params.id);

  if (!data) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Check the ownership/publisher of the bootcamp, admin can delete anything
  if (req.user.id !== data.user.toString() && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(`User is not authorized to delete this bootcamp`, 401)
    );
  }

  await data.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Get bootcamps within km radius, GET /api/v1/bootcamp/radius/:zipcode/:distance, public
exports.getBootcampsWithinRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/long from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const long = loc[0].longitude;

  // Calc radius using radians || earth radius => 6378 km
  const radius = distance / 6378;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    data: bootcamps,
    count: bootcamps.length,
  });
});

// Upload bootcamp photo by id, PUT /api/v1/bootcamp/:id/photo, private
exports.uploadPhotoBootcamp = asyncHandler(async (req, res, next) => {
  const data = await Bootcamp.findById(req.params.id);

  if (!data) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Check the ownership/publisher of the bootcamp, admin can update anything
  if (req.user.id !== data.user.toString() && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(`User is not authorized to update this bootcamp`, 401)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`No file uploaded`, 404));
  }

  // Validation, mimetypes & filesize
  const uploadedImage = req.files.file;

  if (!uploadedImage.mimetype.startsWith('image/')) {
    return next(new ErrorResponse(`Files must be image`, 404));
  }

  if (uploadedImage.size > process.env.FILE_SIZE_LIMIT) {
    return next(new ErrorResponse(`Files too large`, 404));
  }

  // Customize filename && extension
  uploadedImage.name = `image_bootcamp_${data._id}${
    path.parse(uploadedImage.name).ext
  }`;

  // Upload the file
  uploadedImage.mv(
    `${process.env.FILE_PATH}/${uploadedImage.name}`,
    async (err) => {
      if (err) {
        console.log(err);
        return next(
          new ErrorResponse(`There is a problem with files uploading`, 404)
        );
      }
      await Bootcamp.findByIdAndUpdate(data._id, {
        images: uploadedImage.name,
      });
      res.status(200).json({
        success: true,
        data: uploadedImage.name,
      });
    }
  );
});
