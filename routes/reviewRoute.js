const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
// POST:tours/826y437/reviews

router.use(authController.protect); // All the routes(middlewares) after this middleware are protected

router
  .route('/')
  .get(reviewController.getAllreviews)
  .post(
    authController.restrictTO('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTO('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTO('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
