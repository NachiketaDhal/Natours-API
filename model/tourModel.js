const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

// Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have atmost 40 characters'], // validators
      minlength: [10, 'A tour must have atleast 10 characters'],
      // validate: [validator.isAlpha, 'A tour name must contain only characters'], // validation using 3rd party package
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be between 1 and 5'], // validators
      max: [5, 'Rating must be between 1 and 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666667--> 46.666667--> 47--> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator
      // The following validator doesn't work on update query
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be lower than regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // removes white space present at the beginning and ending
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties(we can't use this in a query as they are not part of Database)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() /////////////////////////////////////
tourSchema.pre('save', function (next) {
  // console.log(this); // this --> access to the document to be processed
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// this middleware embeds the whole user-guide document into tour from their id
// at first guides was an array containing ids of guides then whole document of guide
// tourSchema.pre('save', async function (next) {
//   const toursPromise = this.guides.map(async (id) => await User.findById(id));
//   // toursPromise array is a collection of promises so...
//   this.guides = await Promise.all(toursPromise);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save documents');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc); // doc--> document that was just saved to the Database
//   next();
// });

// QUERY MIDDLEWARE--> runs before or after a query is executed/////////////////////////////////////
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // this --> current query

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

// AGGRIGATION MIDDLEWARE--> runs before or after an aggrigation happens ///////////////////////////////////
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline()); // current aggrigation
//   next();
// });

// Model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
