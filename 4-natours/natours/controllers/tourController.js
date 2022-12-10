// middleware functions related to tours
const Tour = require('../models/tourModel');

// const validateQuery = (queryObj, allowedQueryParams) => {
//   const params = Object.keys(queryObj);
//   const isValid = params.every((param) => allowedQueryParams.includes(param));
//   return isValid;
// };

// const getFilteringQuery = (queryObj, allowedFilteringParams) => {
//   const filteringQuery = {};
//   Object.keys(queryObj).forEach((param) => {
//     if (allowedFilteringParams.includes(param))
//       filteringQuery[param] = queryObj[param];
//   });
//   return filteringQuery;
// };

const formatFilteringQueryOperations = (
  filteringQueryObj,
  filteringQueryOperations
) => {
  // stringifying the query object to be able to use the replace method to add the $ sign to the operators to match the mongo shell syntax
  let queryStr = JSON.stringify(filteringQueryObj);
  const operatorsRegex = new RegExp(
    `\\b(${filteringQueryOperations.join('|')})\\b`,
    `g`
  );
  queryStr = queryStr.replace(operatorsRegex, (match) => `$${match}`);
  return JSON.parse(queryStr);
};

// middleware function to alias the top 5 cheap tours
// after it is called, the getAllTours function is called
exports.aliasTopTours = (req, res, next) => {
  // prefilling the query object with the values we want
  req.query.limit = '5'; // object values are always strings
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
  // request object is mutated and passed to getAllTours
};

class APIQuery {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }

  static allowedQueryParams = [
    ['duration', 'difficulty', 'price'], // filtering
    'sort', // sorting
    'fields', // field limiting
    'page', // pagination
    'limit', // pagination
  ];
  static allowedFilteringQueryOperations = ['gt', 'gte', 'lt', 'lte'];

  validate() {
    const params = Object.keys(this.reqQuery);
    const isValid = params.every((param) =>
      this.allowedQueryParams.flat().includes(param)
    );
    return isValid;
  }

  find() {
    const filteringQuery = {};
    Object.keys(this.reqQuery).forEach((param) => {
      if (this.allowedQueryParams[0].includes(param))
        filteringQuery[param] = this.reqQuery[param];
    });
    let queryStr = JSON.stringify(filteringQuery);
    const operatorsRegex = new RegExp(
      `\\b(${this.allowedFilteringQueryOperations.join('|')})\\b`,
      `g`
    );
    queryStr = queryStr.replace(operatorsRegex, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.reqQuery.sort) {
      const sortBy = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  select() {
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  limit() {
    if (this.reqQuery.limit && !this.reqQuery.page) {
      if (!Number.isInteger(+this.reqQuery.limit) || +this.reqQuery.limit < 1)
        throw new Error('Limit must be an integer greater than 0');
      this.query = this.query.limit(+this.query.limit);
    }
    return this;
  }

  paginate() {
    if (this.reqQuery.page && this.reqQuery.limit) {
      if (
        !Number.isInteger(+this.reqQuery.page) ||
        !Number.isInteger(+this.reqQuery.limit) ||
        +this.reqQuery.page < 1 ||
        +this.reqQuery.limit < 1
      )
        throw new Error('Page and limit must be integers greater than 0');
      const skip = (+this.reqQuery.page - 1) * +this.reqQuery.limit;
      this.query = this.query.skip(skip).limit(+this.reqQuery.limit);
    }
    return this;
  }
}

exports.getAllTours = async (req, res) => {
  try {
    console.log('Query:', req.query);
    const queryObj = { ...req.query };
    // const allowedQueryParams = [
    //   ['duration', 'difficulty', 'price'], // filtering
    //   'sort', // sorting
    //   'fields', // field limiting
    //   'page', // pagination
    //   'limit', // pagination
    // ];

    let query;

    // BUILDING QUERY
    if (Object.keys(queryObj).length > 0) {
      if (!validateQuery(queryObj, allowedQueryParams.flat()))
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

      // query = Tour.find(); // like in mongo shell, not specifying a filter returns all documents

      // ADVANCED FILTERING
      // query includes fields, operators and values
      // url query: ?duration[gte]=5&difficulty=easy
      // req query: { duration: { gte: '5' }, difficulty: 'easy' }
      // mongosh query: .find({ duration: { $gte: 5 }, difficulty: 'easy' })
      // mongoose query: .find({ duration: { $gte: '5' }, difficulty: 'easy' })

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
        // if you're going to sort by a field, this must be returned in the query in which you will sort
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

      // LIMITING
      // url query: ?limit=10
      // req query: { limit: '10' }
      // mongosh query: .find().limit(10)
      // mongoose query object: .find().limit(10)

      // avoid problems with pagination
      if (queryObj.limit && !queryObj.page) {
        if (!Number.isInteger(+queryObj.limit) || queryObj.limit < 1)
          throw new Error('Limit must be an integer greater than 0');
        query = query.limit(+queryObj.limit);
      }

      // PAGINATION
      // page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3...
      // url query: ?page=2&limit=10
      // req query: { page: '2', limit: '10' }
      // mongosh query: .find().skip(10).limit(10)
      // mongoose query object: .find().skip(10).limit(10)

      if (queryObj.page && queryObj.limit) {
        // must be int
        if (
          !Number.isInteger(+queryObj.page) ||
          !Number.isInteger(+queryObj.limit) ||
          queryObj.page < 1 ||
          queryObj.limit < 1
        )
          throw new Error('Page and limit must be integers greater than 0');
        const skip = (queryObj.page - 1) * queryObj.limit;
        const limit = +queryObj.limit;
        console.log('skip:', skip, 'limit:', limit);
        const numTours = await Tour.countDocuments();
        if (skip >= numTours) throw new Error('This page does not exist');
        query = query.skip(skip).limit(limit);
      }
      // if not specified, we will show all documents
    } else {
      query = Tour.find().sort('-createdAt').select('-__v');
    }

    // EXECUTING QUERY
    // using exec for promises: https://mongoosejs.com/docs/promises.html
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
