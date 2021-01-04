const dotenv = require('dotenv');
const mongoose = require('mongoose');

// UNCAUGHT EXCEPTION(Errors occured in synchronous code, but never handles)
// Should be defined in the top-level
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// DATABASE
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Create connection
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful')); // resolve
// .catch((err) => console.log(err)); // reject

// Creating Document
/*
const testTour = new Tour({
  name: 'The Park Camper',
  price: 997,
});
testTour
  .save()
  .then((doc) => console.log(doc))
  .catch((err) => console.log('Error 💥: ', err)); 
*/

// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// UNHANDLED PROMISE REJEJCTION(Errors occured in asynchronous code, but never handles)
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1); // 0--> success, 1--> exceptions
  });
});

// console.log(x);
