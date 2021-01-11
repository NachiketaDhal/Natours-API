const Tour = require('./../model/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// const fs = require('fs');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
// );

// param middleware
/* exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is ${val}`);
  const id = parseInt(req.params.id);
  // console.log(typeof req.params.id);   // string
  if (id >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
}; */

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// top-5-cheap
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, ratingsAverage, price, description, difficulty';
  next();
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET ALL TOURS
exports.getAllTours = factory.getAll(Tour);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET A PARTICULAR TOUR
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATE TOUR
exports.createTour = factory.createOne(Tour);
// const newTour = new Tour({});
// newTour.save();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UPDATE TOUR
exports.updateTour = factory.updateOne(Tour);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DELETE TOUR
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET TOUR STATS USING AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, // filter
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET MONTHLY PLAN USING AGGREGATION PIPELINE
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
});
