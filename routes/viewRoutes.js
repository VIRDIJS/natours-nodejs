const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(viewsController.alerts);
// router.use(authController.isLoggedIn);

// router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.get('/signup',viewsController.signup);
router.get('/login',authController.isLoggedIn, viewsController.login);
router.get('/tour/:slug',authController.isLoggedIn, viewsController.getTour);
router.post('/submit-user-data',authController.protect, viewsController.updateUserData)

module.exports = router;
