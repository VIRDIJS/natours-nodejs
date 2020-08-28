// ******/Require Declarations/*******
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel')
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
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
  // console.log('req.body',req.body)
  next();
};

// Only allow users to write a review for a tour they have booked.
exports.checkBookings = catchAsync( async (req,res,next) => {
  // console.log(req);
  const booking = await Booking.findOne({tour:req.body.tour,user:req.body.user})
  if(!booking){
    return next(new AppError('You have to book this tour to write a review',403))
  }
  res.status(200).json({
    status:'success'
  })
  next();
})

exports.createReview = factory.createOne(Review)
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getAllReviews = factory.getAll(Review)

