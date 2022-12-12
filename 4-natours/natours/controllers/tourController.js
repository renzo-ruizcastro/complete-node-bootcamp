const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  // prefilling the query object with the values we want
  req.query.limit = '5'; // object values are always strings
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
  // request object is mutated and passed to getAllTours
};

exports.getAllTours = async (req, res) => {
  try {
    console.log('Query:', req.query);
    const features = new APIFeatures(Tour.find(), req.query).init();
    const tours = await features.query.exec();

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // similar to Tour.findOne({ _id: req.params.id })
    const tour = await Tour.findById(
      // we expect to receive a tour id from the url
      req.params.id
    );
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  // instead of calling a method (.save) in the document (Model instance)...
  // const newTour = new Tour({});
  // newTour.save();

  // We call a method on the model (Model class)
  // use
  try {
    // bare in mind that only keys defined in the schema will be saved in newTour
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      // 201: created
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      // error handling later in the course
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // all these model methods actually returns mongoose Query objects (instances)
    // findAndUpdate only updates fields that differ from the original
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      runValidators: true, // run schema validators on update, setting it to false will skip the validators
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    // mongoose executes type casting to the req.body values
    // that's why setting "price" to "500" will work but to "hello" won't
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    // aggregation pipeline
    // parameters: array of stages

    // .aggregate() returns a promise, a Aggregate object
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } }, // filter, preliminary stage
      {
        $group: {
          // _id: null, // indicates what to group by. Here null means group all documents together
          _id: { $toUpper: '$difficulty' }, // group by difficulty
          numTours: { $sum: 1 }, // $sum: 1 means count the number of documents, add 1 for each document
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' }, // the name of the field must be prefixed with $
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      // at this point we can only interact with the data in the group stage, in addition, we have to use the same key names as in the group stage
      {
        $sort: {
          avgPrice: 1, // 1: ascending, -1: descending
        },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } }, // $ne: not equal. Exclude easy tours
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
      { $unwind: '$startDates' }, // $unwind: split the array into multiple documents
      {
        // get only documents that have startDates in the specified year
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' }, // group by month
          numTourStarts: { $sum: 1 }, // count the number of documents
          tours: { $push: '$name' }, // push the name of the tour into an array
        },
      },
      {
        $addFields: { month: '$_id' }, // add a new field to the document
      },
      // OR
      // { $set: { month: '$_id' } },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 }, // sort by month
      },
      // {
      //   $limit: 6, // limit the number of documents
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: { plan },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
