// ******/Require Declarations/*******
const Review = require('../models/reviewModel');
// const APIFeatures = require('../utils/apiFeatures');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// ******/Request Handlers/*******
// Middleware
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  // if user id is not defined in request body than capture it from the protect middleware
  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
};

exports.createReview = factory.createOne(Review)
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getAllReviews = factory.getAll(Review)

