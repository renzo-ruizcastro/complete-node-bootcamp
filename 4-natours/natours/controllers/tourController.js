// middleware functions related to tours
const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find(); // like in mongo shell, not specifying a filter returns all documents
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
      message: err,
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
    console.log(err);
    res.status(400).json({
      status: 'fail',
      // error handling later in the course
      message: 'Invalid data sent!',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // all these model methods actually returns mongoose Query objects (instances)
    // findAndUpdate only updates fields that differ from the original
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      runValidators: true, // run schema validators on update
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
