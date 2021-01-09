const Review = require('../model/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllreviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find().select('-__v');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews: reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
