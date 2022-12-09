// middleware functions related to tours
const Tour = require('../models/tourModel');

const validateQueryParams = (allowedQueryParams, paramsPassed) => {
  const params = Object.keys(paramsPassed);
  const isValid = params.every((param) => allowedQueryParams.includes(param));
  return isValid;
};

const getFilteringQuery = (queryObj, allowedFilteringParams) => {
  const filteringQuery = {};
  Object.keys(queryObj).forEach((param) => {
    if (allowedFilteringParams.includes(param))
      filteringQuery[param] = queryObj[param];
  });
  return filteringQuery;
};

const formatFilteringQueryOperations = (
  filteringQueryObj,
  filteringQueryOperations
) => {
  let queryStr = JSON.stringify(filteringQueryObj);
  const operatorsRegex = new RegExp(
    `\\b(${filteringQueryOperations.join('|')})\\b`,
    `g`
  );
  queryStr = queryStr.replace(operatorsRegex, (match) => `$${match}`);
  return JSON.parse(queryStr);
};

exports.getAllTours = async (req, res) => {
  try {
    console.log('Query:', req.query);
    const queryObj = { ...req.query };
    const allowedQueryParams = [
      ['duration', 'difficulty', 'price'], // filtering
      'sort', // sorting
      'fields', // field limiting
      'page', // pagination
      'limit', // pagination
    ];

    let query;

    // BUILDING QUERY
    if (Object.keys(queryObj).length > 0) {
      if (!validateQueryParams(allowedQueryParams.flat(), queryObj))
        throw new Error('Invalid query params');
      // since the queryObj object is similar to the filtering object in mongo shell we will use it to filter

      // FILTERING
      // query includes only fields and values
      // url query: ?duration=5&difficulty=easy
      // req query: { duration: '5', difficulty: 'easy' }
      // mongosh query: .find({ duration: 5, difficulty: 'easy' })
      // mongoose query: .find({ duration: '5', difficulty: 'easy' })

      // const tours = await Tour.find({ duration: 5, difficulty: 'easy' }); // first way to filter (mongo way)
      // const tours = await Tour.find()
      //   .where('duration')
      //   .equals(5)
      //   .where('difficulty')
      //   .equals('easy'); // second way to filter (mongoose way)

      // const tours = await Tour.find(); // like in mongo shell, not specifying a filter returns all documents

      // ADVANCED FILTERING
      // query includes fields, operators and values
      // url query: ?duration[gte]=5&difficulty=easy
      // req query: { duration: { gte: '5' }, difficulty: 'easy' }
      // mongosh query: .find({ duration: { $gte: 5 }, difficulty: 'easy' })
      // mongoose query: .find({ duration: { $gte: '5' }, difficulty: 'easy' })

      // // stringifying the query object to be able to use the replace method to add the $ sign to the operators to match the mongo shell syntax
      // let queryStr = JSON.stringify(queryObj);
      // // this advanced filtering already includes the basic filtering and other params like sort if no operators are specified
      // queryStr = queryStr.replace(
      //   // you can specify more operator
      //   /\b(gte|gt|lte|lt)\b/g,
      //   (match) => `$${match}`
      // );
      // // converting the stringified query object back to an object
      // query = Tour.find(JSON.parse(queryStr)); // .find() returns actually a query object

      const filteringQuery = getFilteringQuery(queryObj, allowedQueryParams[0]);
      console.log('Filtering query:', filteringQuery);

      const allowedFilteringOperators = ['gte', 'gt', 'lte', 'lt'];
      const formattedFilteringQuery = formatFilteringQueryOperations(
        filteringQuery,
        allowedFilteringOperators
      );
      console.log('Formatted filtering query:', formattedFilteringQuery);
      query = Tour.find(formattedFilteringQuery);

      // SORTING
      // sort by fields, by default ascending order
      // url query: ?sort=price or ?sort=price,ratingsAverage
      // req query: { sort: 'price' } or  { sort: 'price,ratingsAverage' }
      // mongosh query: .find().sort({ price: 1 }) or .find().sort({ price: 1, ratingsAverage: 1 })
      // mongoose query object: .find().sort('price') or .find().sort('price ratingsAverage')

      if (queryObj.sort) {
        const sortBy = queryObj.sort.split(',').join(' ');
        query = query.sort(sortBy);
        // descending way is handled by mongoose, just by adding a - before the sorted field name: ?sort=-price
        // what if two or more fields have the same value?
        // you have to specify a second field to sort by: ?sort=price-ratingsAverage
        // sorting goes from left to right
      } else {
        // default sorting
        query = query.sort('-createdAt');
      }
      // we remove await here because we may want to add more query methods later
      // query = Tour.find(queryObj);

      // FIELD LIMITING
      // url query: ?fields=name,duration,difficulty,price
      // req query: { fields: 'name,duration,difficulty,price' }
      // mongosh query: .find().select({ name: 1, duration: 1, difficulty: 1, price: 1 })
      // mongoose query object: .find().select('name duration difficulty price')

      if (queryObj.fields) {
        const fields = queryObj.fields.split(',').join(' ');
        query = query.select(fields); // projecting: only show the fields specified
      } else {
        query = query.select('-__v');
        // __v is a mongoose field, we don't want to show it
        // prefixing a field with a - means that we don't want to show it, all other fields will be shown
      }

      // PAGINATION
      // page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3...
      // url query: ?page=2&limit=10
      // req query: { page: '2', limit: '10' }
      // mongosh query: .find().skip(10).limit(10)
      // mongoose query object: .find().skip(10).limit(10)

      if (queryObj.page && queryObj.limit) {
        const skip = (queryObj.page - 1) * queryObj.limit;
        const limit = +queryObj.limit;
        console.log('skip:', skip, 'limit:', limit);
        query = query.skip(skip).limit(limit);
      }
      // if not specified, we will show all documents
    } else {
      query = Tour.find().sort('-createdAt').select('-__v');
    }

    // EXECUTING QUERY
    const tours = await query.exec();

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
