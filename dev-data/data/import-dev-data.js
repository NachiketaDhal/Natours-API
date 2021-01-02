const dotenv = require('dotenv');
dotenv.config({ path: '../../config.env' });
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../model/tourModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// Reading JSON file
const tours = JSON.parse(fs.readFileSync('tours-simple.json', 'utf-8'));

// Importing all data to DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfuly loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete existing data form DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('All data have been deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// console.log(process.argv);
