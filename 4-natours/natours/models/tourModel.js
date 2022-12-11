const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
      // enum: ['easy', 'medium', 'difficult'], // only these values are allowed
      required: [true, 'A tour must have a difficulty'],
    },

    // not required because is not the user who will specify this
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'], // [true, error_message]
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true, // removes tailing and leading spaces
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // name of the image, this is in the file system
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // array of strings
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false, // this field will not be returned in the response
    },
    startDates: [Date],
  },
  { strict: true, strictQuery: 'throw' }
);
// mongodb will try to parse each value given to the specified type
// if it can't, it will throw an error

// if you query all your documents you will see that some fields in some documents have appeared.
// this happens on fields that are not required but have a default value
// also those which have an array as a value will have an empty array as a default value
// required fields will not appear in documents where they were not specified

// Convention: Capitalize first letter of model name
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
