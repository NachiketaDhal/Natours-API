const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(reviewController.getAllreviews)
  .post(
    authController.protect,
    authController.restrictTO('user'),
    reviewController.createReview
  );

module.exports = router;
