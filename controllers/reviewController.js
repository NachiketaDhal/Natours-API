const Review = require('../model/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// MIDDLEWARE used incase of creating review
exports.setTourUserIds = (req, res, next) => {
  // Allow nested route
  if (!req.body.tour) req.body.tour = req.params.tourId; // current Tour
  if (!req.body.user) req.body.user = req.user.id; // loggedin user
  next();
};

exports.getAllreviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
