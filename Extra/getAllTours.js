//  BUILD QUERY
// 1A) Filtering
const queryObj = { ...req.query };
const excludedFields = ['page', 'sort', 'limit', 'fields'];
excludedFields.forEach((el) => delete queryObj[el]);

// 1B) Advanced filtering
let queryStr = JSON.stringify(queryObj);
queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
/* { difficulty: 'easy', duration: { $gte: 5 } }
    { difficulty: 'easy', duration: { gte: 5 } }
    gt, gte, lt, lte */

// console.log(req.query, queryObj);
// console.log(queryStr);
let query = Tour.find(JSON.parse(queryStr));

// 2) Sorting
if (req.query.sort) {
  const sortBy = req.query.sort.split(',').join(' ');
  query = query.sort(sortBy);
} else {
  query = query.sort('-createdAt');
}

// 3) Field Limiting
if (req.query.fields) {
  let fields = req.query.fields.split(',').join(' ');
  query = query.select(fields); // including
} else {
  query = query.select('-__v'); // excluding(-)
}

// 4) Pagination
const page = parseInt(req.query.page) || 1; // page number
const limit = parseInt(req.query.limit) || 10; // total number of documnets per page
const skip = (page - 1) * limit; // total number of documnets to skip

query = query.skip(skip).limit(limit);

if (req.query.page) {
  const numTours = await Tour.countDocuments();
  if (skip > numTours) {
    throw new Error('This page does not exist');
  }
}
