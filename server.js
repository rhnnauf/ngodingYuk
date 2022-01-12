const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error');
const fileupload = require('express-fileupload');
const path = require('path');
const cookieParser = require('cookie-parser');

const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Express
const app = express();

// Environments
dotenv.config({
  path: './config/config.env',
});

// Mongo Connection
const DB = require('./config/db');
DB();

// Importing Route
const bootcampRoute = require('./routes/bootcamp');
const courseRoute = require('./routes/course');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const adminRoute = require('./routes/admin');
const reviewRoute = require('./routes/review');

// Importing Middleware
app.use(express.json()); // Body Parser

// Logging middleware for development purposes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File upload middleware
app.use(fileupload());

// Cookie middleware
app.use(cookieParser());

// Sanitize user input
app.use(mongoSanitize());

// Set security middleware aka helmet
app.use(helmet({ contentSecurityPolicy: false }));

// XSS middleware
app.use(xssClean());

// Rate limit
const limit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // 1000 request
});

app.use(limit);

// Http param pollution middleware
app.use(hpp());

// CORS middleware, so other domain can use our resource
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================================================================================================
app.use('/api/v1/auth', authRoute, errorHandler);
app.use('/api/v1/bootcamp', bootcampRoute, errorHandler);
app.use('/api/v1/course', courseRoute, errorHandler);
app.use('/api/v1/user', userRoute, errorHandler);
app.use('/api/v1/admin', adminRoute, errorHandler);
app.use('/api/v1/review', reviewRoute, errorHandler);

// =====================================================================================================================================================

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
  );
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
