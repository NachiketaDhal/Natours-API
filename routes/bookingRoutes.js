const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect); // All the routes(middlewares) after this middleware are protected

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTO('admin', 'lead-guide')); // Only admin can access the routes below this middleware

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
