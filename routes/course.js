const express = require('express');

const router = express.Router({ mergeParams: true });

const Course = require('../models/Course');

const paginationAndQuery = require('../middlewares/paginationAndQuery');

const protectedRoute = require('../middlewares/auth');

const courseController = require('../controllers/course');

router.get(
  '/',
  paginationAndQuery(Course, {
    path: 'bootcamp',
    select: 'name description',
  }),
  courseController.getAllCourses
);

router.post(
  '/',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  courseController.createCourse
);

router.get('/:courseId', courseController.getCourse);

router.put(
  '/:courseId',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  courseController.updateCourse
);

router.delete(
  '/:courseId',
  protectedRoute.protectedRouteAuthorization,
  protectedRoute.roleAuthorization('Publisher', 'Admin'),
  courseController.deleteCourse
);

module.exports = router;
