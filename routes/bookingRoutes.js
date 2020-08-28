const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });

router.get('/checkout-session/:tourId',authController.protect, bookingController.getCheckoutSession);

router
.route('/')
.get(authController.protect,authController.restrictTo('guide','lead-guide','admin'), bookingController.getAllBookings)
.post(authController.protect,authController.restrictTo('admin'), bookingController.createBooking)

router
.route('/:id')
.get(authController.protect,authController.restrictTo('guide','lead-guide','admin'), bookingController.getBooking)
.delete(authController.protect,authController.restrictTo('admin'), bookingController.deleteBooking)


module.exports = router;


