const dotenv = require('dotenv');
const mongoose = require('mongoose');
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
  .then(() => console.log('DB connection successful')) // resolve
  .catch((err) => console.log(err)); // reject

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
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
