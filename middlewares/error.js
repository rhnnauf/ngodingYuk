const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Print error to console
  //   console.log(err);

  // Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Duplicate Mongoose
  if (err.code === 11000) {
    const message = `Value already exist in database`;
    error = new ErrorResponse(message, 400);
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => {
      return val.message;
    });

    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
