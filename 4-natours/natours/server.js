const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_REMOTE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
// mongoose
//   .connect(DB, {
//     // returns a promise
//     // options to deal with deprecation warnings
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//   })
//   .then((con) => {
//     console.log(con.connections);
//     console.log('DB connection successful!');
//   });

mongoose
  .connect(DB, {
    // moongose version used in the course: ^5.5.2
    // https://mongoosejs.com/docs/migrating_to_6.html#no-more-deprecation-warning-options
    // useNewUrlParser: true, // mongo 6.0 behaves as it uses this
    // useCreateIndex: true, // already done by mongo 6.0
    // useFindAndModify: false, // already done by mongo 6.0
  })
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connection successful!');
  });

// Moved to ./models/tourModel.js
// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   rating: {
//     type: Number,
//     default: 4.5,
//   },
//   price: {
//     type: Number,
//     required: [true, 'A tour must have a price'], // [true, error_message]
//   },
// });

// Convention: Capitalize first letter of model name
// const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR 💥: ', err);
//   });

// creates (if doesn't exist) a collection with the name of the model in lowercase and plural

const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
