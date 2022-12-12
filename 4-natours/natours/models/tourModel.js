// fat model thin controller
const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true, // technically not a validator
      trim: true,
      // other validators
      // these are actually only for strings
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // match: [regex, 'error message'],
      // there are other built-in validators, check the docs
      // https://mongoosejs.com/docs/validation.html#built-in-validators

      // custom validator
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // we don't call the function, we pass it as a reference
    },
    slug: String, // url friendly version of the name
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
      // validators
      // enum works only for strings
      enum: {
        // in fact, array notation is a shortcut for this object notation
        values: ['easy', 'medium', 'difficult'], // only these values are allowed
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    // not required because is not the user who will specify this
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // validators
      // min and max work also for dates
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'], // [true, error_message]
    },
    priceDiscount: {
      type: Number,
      // custom validator, the property must be called validate
      validate: {
        // the message has also access to the value that was inputed
        // here is a specific syntaxis of mongoose to display the value -> {VALUE}
        message: 'Discount price ({VALUE}) should be below regular price',
        validator: function (val) {
          // this here points to the document that is being created, NOT updated
          // the value returned by a validate function is a boolean
          return val < this.price;
        },
        // we don't call the function, we pass it as a reference
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: true,
    strictQuery: 'throw',
    toJSON: {
      // each time the data is outputted as JSON, virtuals will be included
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);
// mongodb will try to parse each value given to the specified type
// if it can't, it will throw an error

// if you query all your documents you will see that some fields in some documents have appeared.
// this happens on fields that are not required but have a default value
// also those which have an array as a value will have an empty array as a default value
// required fields will not appear in documents where they were not specified

// VIRTUAL PROPERTIES
// are not stored in the db, they are calculated using other fields
// even if they are outtputed in the response data, we can't use them in queries since they are not part of the db

// calling the get() method means that ea ch time we get some data from the db, this virtual property will be calculated

// the function passed to the get() method must be a regular function, not an arrow function because arrow functions do not have their own this keyword
// if you don't need to use the this keyword, you can use an arrow function
tourSchema.virtual('durationWeeks').get(function () {
  // this points to the current document
  return this.duration / 7;
});
// we could've done this in the controller, but it would be a bad practice. we should keep the controller as clean as possible

// DOCUMENT MIDDLEWARE
// runs before .save() and .create(), but not on .insertMany() or .update()
// usually used to run some code before saving a document to the db
// uses the save hook

// each middleware function in a pre saved middleware has access to the next() function
// here middlewares are also called hooks
tourSchema.pre('save', function (next) {
  // this points to the current processed document
  // slug must be defined in the schema
  this.slug = slugify(this.name, { lower: true });
  next();
});

// you can have multiple pre middlewares
// just remember that the order in which you define them is the order in which they will be executed
// tourSchema.pre('save', (next) => {
//   console.log('Will save document...');
//   next();
// });

// post middleware
// they are executed after all the pre middleware functions have been executed
// tourSchema.post('save', (doc, next) => {
// doc is the document that was just saved
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// pre find: runs before a find query is executed
// using regex to match all queries that start with find
tourSchema.pre(/^find/, function (next) {
  // this keyword points to the current query
  this.find({ secretTour: { $ne: true } }); // we can chain methods (querys) like find() to the query
  // since query object is a regular object, we can add properties to it
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline() // is an array of all the stages in the aggregation pipeline
    .unshift({ $match: { secretTour: { $ne: true } } }); // unshift: add an element to the beginning of an array
  // this points to the current aggregation object
  // console.log(this.pipeline()); // prints exactly what we defined in the aggregate() method, the aggregation pipeline
  next();
});

// MODEL MIDDLEWARE is not used very often

// Convention: Capitalize first letter of model name
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
